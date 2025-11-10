import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Eye, User, Power, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNewCards, useCreateCard, useUpdateCard, useDeleteCard, CreateCardData, NewCardData } from '@/hooks/useNewCards';
import { NewCard } from './NewCard';
import { NewImageUpload } from './NewImageUpload';
import { ExclusiveCardSystem } from './ExclusiveCardSystem';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';

interface CardFormData extends Omit<CreateCardData, 'rarity'> {
  rarity: string;
  is_special: boolean;
  assigned_to: string;
}

export function NewManageCards() {
  const { profile } = useAuth();
  const { data: cards, isLoading } = useNewCards();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<NewCardData | null>(null);
  const [formData, setFormData] = useState<CardFormData>({
    name: '',
    rarity: 'common',
    image_url: '',
    price: 100,
    description: '',
    available: true,
    copies_available: null,
    is_special: false,
    assigned_to: '',
  });
  const [students, setStudents] = useState<any[]>([]);
  const [isSpecialCard, setIsSpecialCard] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'student')
      .order('name');
    
    if (data) setStudents(data);
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Apenas administradores podem gerenciar cartas.</p>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      name: '',
      rarity: 'common',
      image_url: '',
      price: 100,
      description: '',
      available: true,
      copies_available: null,
      is_special: false,
      assigned_to: '',
    });
    setEditingCard(null);
    setIsSpecialCard(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (card: NewCardData) => {
    setFormData({
      name: card.name,
      rarity: card.rarity,
      image_url: card.image_url || '',
      price: card.price,
      description: card.description || '',
      available: card.available,
      copies_available: card.copies_available,
      is_special: false,
      assigned_to: '',
    });
    setEditingCard(card);
    setIsCreateDialogOpen(true);
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    // Se é carta especial, precisa ter um aluno atribuído
    if (isSpecialCard && !formData.assigned_to) {
      alert('Selecione um aluno para receber esta carta especial');
      return;
    }

    const cardData: any = {
      name: formData.name.trim(),
      rarity: formData.rarity as 'common' | 'rare' | 'legendary' | 'mythic',
      image_url: formData.image_url?.trim() || undefined,
      price: formData.price,
      description: formData.description?.trim() || undefined,
      available: isSpecialCard ? false : formData.available, // Cartas especiais não ficam disponíveis para todos
      copies_available: formData.copies_available,
      is_special: isSpecialCard,
      assigned_to: isSpecialCard ? formData.assigned_to : null,
    };

    try {
      if (editingCard) {
        await updateCard.mutateAsync({ id: editingCard.id, ...cardData });
      } else {
        // Criar carta
        const { data: newCard, error } = await supabase
          .from('cards')
          .insert(cardData)
          .select()
          .single();

        if (error) throw error;

        // Se é carta especial, adicionar diretamente ao aluno
        if (isSpecialCard && newCard && formData.assigned_to) {
          await supabase.from('user_cards').insert({
            user_id: formData.assigned_to,
            card_id: newCard.id,
            quantity: 1
          });
        }
      }
      closeDialog();
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Erro ao salvar carta');
    }
  };

  const handleDelete = async (cardId: string) => {
    try {
      await deleteCard.mutateAsync(cardId);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleImageSelected = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="manage" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="manage">Gerenciar Cartas</TabsTrigger>
        <TabsTrigger value="special" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Cartas Especiais
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manage">
        <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Cartas</h1>
          <p className="text-gray-600 mt-1">
            Crie, edite e organize as cartas do sistema
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Carta
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? 'Editar Carta' : 'Nova Carta'}
              </DialogTitle>
              <DialogDescription>
                {editingCard ? 'Edite as informações da carta' : 'Crie uma nova carta para o sistema'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column - Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Carta *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome da carta"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="rarity">Raridade *</Label>
                    <Select
                      value={formData.rarity}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, rarity: value }))}
                    >
                      <SelectTrigger>
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

                  <div>
                    <Label htmlFor="price">Preço (IFCoins) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="copies">Cópias Disponíveis</Label>
                    <Input
                      id="copies"
                      type="number"
                      min="0"
                      value={formData.copies_available || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        copies_available: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                      placeholder="Deixe vazio para ilimitado"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da carta"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <Label htmlFor="special-card">Carta Especial (exclusiva para um aluno)</Label>
                      </div>
                      <Switch
                        id="special-card"
                        checked={isSpecialCard}
                        onCheckedChange={setIsSpecialCard}
                      />
                    </div>
                    
                    {isSpecialCard && (
                      <div>
                        <Label htmlFor="assigned-student">Aluno</Label>
                        <Select
                          value={formData.assigned_to}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o aluno" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Esta carta será criada e entregue diretamente ao aluno
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Image */}
                <div className="space-y-4">
                  <NewImageUpload
                    onImageSelected={handleImageSelected}
                    currentImageUrl={formData.image_url}
                  />

                  {/* Preview */}
                  {formData.name && (
                    <div>
                      <Label>Preview da Carta</Label>
                      <div className="mt-2">
                        <NewCard
                          card={{
                            id: 'preview',
                            name: formData.name,
                            rarity: formData.rarity as any,
                            image_url: formData.image_url,
                            price: formData.price,
                            description: formData.description,
                            available: formData.available,
                          }}
                          showPrice
                          className="max-w-[200px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCard.isPending || updateCard.isPending}
                >
                  {createCard.isPending || updateCard.isPending ? 'Salvando...' : 
                   editingCard ? 'Salvar Alterações' : 'Criar Carta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      {cards && cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="relative group">
              <NewCard 
                card={card}
                showPrice
              />
              
              {/* Info do Criador */}
              <div className="mt-2 px-3 py-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {card.creator ? (
                    card.creator.role === 'admin' ? 
                      'Criado pelo Sistema' : 
                      `Criado por ${card.creator.name}`
                  ) : (
                    'Criado pelo Sistema'
                  )}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditDialog(card)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={card.available ? "default" : "outline"}
                    onClick={async () => {
                      try {
                        await supabase
                          .from('cards')
                          .update({ available: !card.available })
                          .eq('id', card.id);
                        window.location.reload();
                      } catch (error) {
                        console.error('Error toggling card:', error);
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title={card.available ? 'Desativar carta' : 'Ativar carta'}
                  >
                    <Switch className="w-3 h-3" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Carta</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a carta "{card.name}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(card.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              {/* Status Badge */}
              {!card.available && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-yellow-500 text-white">
                    Desativada
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma carta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando sua primeira carta
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira carta
            </Button>
          </CardContent>
        </Card>
      )}
        </div>
      </TabsContent>

      <TabsContent value="special">
        <ExclusiveCardSystem />
      </TabsContent>
    </Tabs>
  );
}