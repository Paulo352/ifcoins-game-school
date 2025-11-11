import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomBadges, useCreateCustomBadge, useUpdateCustomBadge, useDeleteCustomBadge } from '@/hooks/quizzes/useCustomBadges';
import { Plus, Edit, Trash, Award, Star, Trophy, Crown, Zap, Heart, Target, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AwardBadgeDialog } from './AwardBadgeDialog';

const iconOptions = [
  { value: 'award', label: 'Prêmio', icon: Award },
  { value: 'star', label: 'Estrela', icon: Star },
  { value: 'trophy', label: 'Troféu', icon: Trophy },
  { value: 'crown', label: 'Coroa', icon: Crown },
  { value: 'zap', label: 'Raio', icon: Zap },
  { value: 'heart', label: 'Coração', icon: Heart },
  { value: 'target', label: 'Alvo', icon: Target },
  { value: 'medal', label: 'Medalha', icon: Medal },
];

const colorOptions = [
  { value: '#FFD700', label: 'Dourado' },
  { value: '#C0C0C0', label: 'Prata' },
  { value: '#CD7F32', label: 'Bronze' },
  { value: '#FF6B6B', label: 'Vermelho' },
  { value: '#4ECDC4', label: 'Azul' },
  { value: '#95E1D3', label: 'Verde' },
  { value: '#F38181', label: 'Rosa' },
  { value: '#AA96DA', label: 'Roxo' },
];

export function CustomBadgesManagement() {
  const { data: badges, isLoading } = useCustomBadges();
  const createBadgeMutation = useCreateCustomBadge();
  const updateBadgeMutation = useUpdateCustomBadge();
  const deleteBadgeMutation = useDeleteCustomBadge();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [isAwardOpen, setIsAwardOpen] = useState(false);
  const [awardingBadge, setAwardingBadge] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'award',
    color: '#FFD700'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'award',
      color: '#FFD700'
    });
  };

  const handleCreate = () => {
    createBadgeMutation.mutate(formData, {
      onSuccess: () => {
        setIsCreateOpen(false);
        resetForm();
      }
    });
  };

  const handleEdit = (badge: any) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingBadge) return;
    updateBadgeMutation.mutate(
      { badgeId: editingBadge.id, updates: formData },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditingBadge(null);
          resetForm();
        }
      }
    );
  };

  const handleDelete = (badgeId: string) => {
    if (confirm('Tem certeza que deseja deletar esta badge?')) {
      deleteBadgeMutation.mutate(badgeId);
    }
  };

  const handleAward = (badge: any) => {
    setAwardingBadge(badge);
    setIsAwardOpen(true);
  };

  const getIcon = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption?.icon || Award;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Badges Personalizadas</h2>
          <p className="text-muted-foreground">Crie e gerencie badges customizadas para seus alunos</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Badge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Badge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Badge</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aluno Destaque"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da conquista"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger id="icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger id="color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: option.value }} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || createBadgeMutation.isPending}>
                Criar Badge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {badges && badges.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => {
            const Icon = getIcon(badge.icon);
            return (
              <Card key={badge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: badge.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{badge.name}</CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAward(badge)}
                    >
                      Atribuir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(badge)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(badge.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma badge criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie badges personalizadas para reconhecer seus alunos
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Badge
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Badge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Badge</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Ícone</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger id="edit-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Cor</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger id="edit-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: option.value }} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name || updateBadgeMutation.isPending}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de atribuição */}
      {awardingBadge && (
        <AwardBadgeDialog
          badge={awardingBadge}
          open={isAwardOpen}
          onOpenChange={setIsAwardOpen}
        />
      )}
    </div>
  );
}
