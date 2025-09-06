import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useNewCards, useCreateCard, useUpdateCard, useDeleteCard, CreateCardData, NewCardData } from '@/hooks/useNewCards';
import { NewCard } from './NewCard';
import { NewImageUpload } from './NewImageUpload';

interface CardFormData extends Omit<CreateCardData, 'rarity'> {
  rarity: string;
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
  });

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
    });
    setEditingCard(null);
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

    const cardData: CreateCardData = {
      name: formData.name.trim(),
      rarity: formData.rarity as 'common' | 'rare' | 'legendary' | 'mythic',
      image_url: formData.image_url?.trim() || undefined,
      price: formData.price,
      description: formData.description?.trim() || undefined,
      available: formData.available,
      copies_available: formData.copies_available,
    };

    try {
      if (editingCard) {
        await updateCard.mutateAsync({ id: editingCard.id, ...cardData });
      } else {
        await createCard.mutateAsync(cardData);
      }
      closeDialog();
    } catch (error) {
      console.error('Error saving card:', error);
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
  );
}