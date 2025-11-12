import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { useCards, useCreateCard, useUpdateCard, useDeleteCard, type Card as CardType } from '@/hooks/cards/useCards';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ImageSelector } from '@/components/cards/ImageSelector';
import { ImagePreview } from '@/components/ui/image-preview';
import { toast } from '@/hooks/use-toast';

interface CardFormData {
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary' | 'mythic';
  price: number;
  copies_available: number | null;
  image_url: string;
  image_path?: string;
}

const rarityLabels = {
  common: 'Comum',
  rare: 'Raro',
  legendary: 'Lendário',
  mythic: 'Mítico'
};

const rarityColors = {
  common: 'bg-gray-100 text-gray-800',
  rare: 'bg-blue-100 text-blue-800',
  legendary: 'bg-purple-100 text-purple-800',
  mythic: 'bg-yellow-100 text-yellow-800'
};

export function ManageCards() {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CardFormData>({
    name: '',
    description: '',
    rarity: 'common',
    price: 10,
    copies_available: null,
    image_url: '',
    image_path: ''
  });

  const { data: cards, isLoading } = useCards();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  // Verificar se é admin
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado. Apenas administradores podem gerenciar cartas.</p>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rarity: 'common',
      price: 10,
      copies_available: null,
      image_url: '',
      image_path: ''
    });
    setIsEditing(false);
    setEditingCard(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Garantir que image_url não seja uma string vazia (usar null)
    const { image_path, ...cleanForm } = formData;
    const cardData = {
      ...cleanForm,
      image_url: cleanForm.image_url.trim() || null,
      available: true,
    };

    if (isEditing && editingCard) {
      await updateCard.mutateAsync({ id: editingCard.id, ...cardData });
    } else {
      await createCard.mutateAsync(cardData);
    }
    
    resetForm();
  };

  const handleEdit = (card: CardType) => {
    setFormData({
      name: card.name,
      description: card.description || '',
      rarity: card.rarity,
      price: card.price,
      copies_available: card.copies_available,
      image_url: card.image_url || '',
      image_path: ''
    });
    setEditingCard(card);
    setIsEditing(true);
  };

  const handleDelete = async (cardId: string) => {
    await deleteCard.mutateAsync(cardId);
  };

  const toggleAvailability = async (card: CardType) => {
    await updateCard.mutateAsync({
      id: card.id,
      available: !card.available
    });
  };

  // Filtrar cartas por termo de busca
  const filteredCards = cards?.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas
  const totalCards = cards?.length || 0;
  const availableCards = cards?.filter(card => card.available).length || 0;
  const rarityCount = cards?.reduce((acc, card) => {
    acc[card.rarity] = (acc[card.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Cartas</h1>
        <p className="text-muted-foreground mt-1">
          Crie, edite e gerencie as cartas do sistema
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCards}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCards}</div>
          </CardContent>
        </Card>
        {Object.entries(rarityCount || {}).map(([rarity, count]) => (
          <Card key={rarity}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {rarityLabels[rarity as keyof typeof rarityLabels]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Editar Carta' : 'Criar Nova Carta'}</CardTitle>
          <CardDescription>
            {isEditing ? 'Modifique os dados da carta' : 'Adicione uma nova carta ao sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (IFCoins)</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rarity">Raridade</Label>
                <Select value={formData.rarity} onValueChange={(value: any) => setFormData({...formData, rarity: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Comum</SelectItem>
                    <SelectItem value="rare">Raro</SelectItem>
                    <SelectItem value="legendary">Lendário</SelectItem>
                    <SelectItem value="mythic">Mítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="copies">Cópias Disponíveis</Label>
                <Input
                  id="copies"
                  type="number"
                  min="0"
                  placeholder="Deixe vazio para ilimitado"
                  value={formData.copies_available || ''}
                  onChange={(e) => setFormData({
                    ...formData, 
                    copies_available: e.target.value ? parseInt(e.target.value) : null
                  })}
                />
              </div>
            </div>

            <ImageSelector
              value={formData.image_url}
              onChange={(url) => {
                console.log('Nova URL da imagem selecionada:', url);
                setFormData({...formData, image_url: url});
                if (url) {
                  toast({
                    title: "Sucesso",
                    description: "Imagem selecionada com sucesso!"
                  });
                }
              }}
              onPathChange={(path) => setFormData({...formData, image_path: path})}
              label="Imagem da Carta"
              placeholder="URL da imagem ou faça upload do seu dispositivo"
            />

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createCard.isPending || updateCard.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isEditing ? 'Atualizar' : 'Criar'} Carta
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de cartas */}
      <Card>
        <CardHeader>
          <CardTitle>Cartas Cadastradas</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cartas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Raridade</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Cópias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards?.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <ImagePreview 
                      src={card.image_url || ''}
                      alt={card.name}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell>
                    <Badge className={rarityColors[card.rarity]}>
                      {rarityLabels[card.rarity]}
                    </Badge>
                  </TableCell>
                  <TableCell>{card.price} IFCoins</TableCell>
                  <TableCell>
                    {card.copies_available === null ? 'Ilimitado' : card.copies_available}
                  </TableCell>
                  <TableCell>
                    <Badge variant={card.available ? 'default' : 'secondary'}>
                      {card.available ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(card)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAvailability(card)}
                      >
                        {card.available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a carta "{card.name}"? Esta ação não pode ser desfeita.
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}