import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useExclusiveCards, useCreateExclusiveCard, useDeleteExclusiveCard, useReassignExclusiveCard } from '@/hooks/cards/useExclusiveCards';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash, UserCog, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImageSelector } from './ImageSelector';

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  legendary: 'bg-purple-500',
  mythic: 'bg-orange-500'
};

export function ExclusiveCardManagement() {
  const { data: exclusiveCards, isLoading } = useExclusiveCards();
  const createCardMutation = useCreateExclusiveCard();
  const deleteCardMutation = useDeleteExclusiveCard();
  const reassignMutation = useReassignExclusiveCard();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: 'rare' as 'common' | 'rare' | 'legendary' | 'mythic',
    image_url: '',
    assigned_to: '',
    price: 0
  });

  const [reassignData, setReassignData] = useState({
    cardId: '',
    newStudentId: ''
  });

  // Buscar estudantes
  const { data: students } = useQuery({
    queryKey: ['students-for-exclusive'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, class')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rarity: 'rare',
      image_url: '',
      assigned_to: '',
      price: 0
    });
  };

  const handleCreate = () => {
    if (!formData.assigned_to) {
      return;
    }

    createCardMutation.mutate(formData, {
      onSuccess: () => {
        setIsCreateOpen(false);
        resetForm();
      }
    });
  };

  const handleDelete = (cardId: string) => {
    if (confirm('Tem certeza que deseja deletar esta carta exclusiva?')) {
      deleteCardMutation.mutate(cardId);
    }
  };

  const handleReassign = () => {
    if (!reassignData.cardId || !reassignData.newStudentId) return;

    reassignMutation.mutate(reassignData, {
      onSuccess: () => {
        setIsReassignOpen(false);
        setReassignData({ cardId: '', newStudentId: '' });
      }
    });
  };

  const openReassign = (card: any) => {
    setSelectedCard(card);
    setReassignData({ cardId: card.id, newStudentId: '' });
    setIsReassignOpen(true);
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Cartas Exclusivas
          </h2>
          <p className="text-muted-foreground">Crie cartas especiais atribuídas a alunos específicos</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Carta Exclusiva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Carta Exclusiva</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Carta</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carta Especial do Melhor Aluno"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da carta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rarity">Raridade</Label>
                <Select 
                  value={formData.rarity} 
                  onValueChange={(value: any) => setFormData({ ...formData, rarity: value })}
                >
                  <SelectTrigger id="rarity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Comum</SelectItem>
                    <SelectItem value="rare">Rara</SelectItem>
                    <SelectItem value="legendary">Lendária</SelectItem>
                    <SelectItem value="mythic">Mítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Imagem</Label>
                <ImageSelector
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student">Atribuir para Aluno</Label>
                <Select 
                  value={formData.assigned_to} 
                  onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                >
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} {student.class ? `- Turma ${student.class}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo/Razão</Label>
                <Textarea
                  id="reason"
                  value={(formData as any).reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value } as any)}
                  placeholder="Ex: Destaque em projeto final, melhor nota do bimestre, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={!formData.name || !formData.assigned_to || createCardMutation.isPending}
              >
                Criar Carta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {exclusiveCards && exclusiveCards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exclusiveCards.map((card) => (
            <Card key={card.id} className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 ${rarityColors[card.rarity as keyof typeof rarityColors]} opacity-10 rounded-bl-full`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      {card.name}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">
                        {card.rarity}
                      </Badge>
                      <Badge variant="secondary">Exclusiva</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {card.image_url && (
                  <img 
                    src={card.image_url} 
                    alt={card.name}
                    className="w-full h-40 object-cover rounded-md"
                  />
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {card.description || 'Sem descrição'}
                </p>
                <div className="text-sm">
                  <p className="font-medium">Atribuída para:</p>
                  <p className="text-muted-foreground">
                    {(card as any).profiles?.name || 'Não atribuída'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openReassign(card)}
                  >
                    <UserCog className="w-4 h-4 mr-1" />
                    Reatribuir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(card.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma carta exclusiva criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie cartas especiais para reconhecer e recompensar alunos individuais
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Carta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de reatribuição */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reatribuir Carta: {selectedCard?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-student">Novo Aluno</Label>
              <Select 
                value={reassignData.newStudentId} 
                onValueChange={(value) => setReassignData({ ...reassignData, newStudentId: value })}
              >
                <SelectTrigger id="new-student">
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} {student.class ? `- Turma ${student.class}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!reassignData.newStudentId || reassignMutation.isPending}
            >
              Reatribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
