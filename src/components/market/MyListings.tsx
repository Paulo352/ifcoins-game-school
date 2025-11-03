import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyListings, useCreateListing, useCancelListing } from '@/hooks/market/useMarket';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Trash2, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  legendary: 'bg-purple-500',
  mythic: 'bg-orange-500'
};

export function MyListings() {
  const [selectedCard, setSelectedCard] = useState('');
  const [price, setPrice] = useState('');
  const { user } = useAuth();

  const { data: userCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['user-cards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_cards')
        .select('*, card:cards(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const { data: listings, isLoading: listingsLoading } = useMyListings();
  const createListing = useCreateListing();
  const cancelListing = useCancelListing();

  const handleCreateListing = () => {
    const priceNum = parseInt(price);
    
    if (!selectedCard) {
      alert('Selecione uma carta');
      return;
    }

    if (!priceNum || priceNum <= 0) {
      alert('Digite um preço válido');
      return;
    }

    createListing.mutate({ cardId: selectedCard, price: priceNum });
    setSelectedCard('');
    setPrice('');
  };

  const handleCancel = (listingId: string) => {
    if (confirm('Deseja remover este anúncio?')) {
      cancelListing.mutate({ listingId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meus Anúncios</h2>
        <p className="text-muted-foreground">
          Crie anúncios e gerencie suas vendas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Criar Anúncio
            </CardTitle>
            <CardDescription>
              Coloque uma carta sua à venda no IFMarket
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cardsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="card">Selecione a Carta</Label>
                  <Select value={selectedCard} onValueChange={setSelectedCard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma carta" />
                    </SelectTrigger>
                    <SelectContent>
                      {userCards?.map((uc) => (
                        <SelectItem key={uc.card_id} value={uc.card_id}>
                          {uc.card.name} (Qtd: {uc.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço (IFCoins)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 500"
                    min="1"
                  />
                </div>

                <Button 
                  onClick={handleCreateListing}
                  disabled={createListing.isPending}
                  className="w-full"
                >
                  {createListing.isPending ? 'Criando...' : 'Criar Anúncio'}
                </Button>

                <p className="text-xs text-muted-foreground">
                  📅 Anúncios expiram em 7 dias. Taxa de 5% sobre vendas.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anúncios Ativos</CardTitle>
            <CardDescription>
              Suas cartas à venda no marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listingsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : listings && listings.filter(l => l.status === 'active').length > 0 ? (
              <div className="space-y-3">
                {listings
                  .filter(l => l.status === 'active')
                  .map((listing) => (
                    <div key={listing.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{listing.card?.name}</p>
                          <Badge className={rarityColors[listing.card?.rarity || 'common']}>
                            {listing.card?.rarity}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(listing.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Preço:</span>
                        <span className="font-bold text-ifpr-green">
                          {listing.price.toLocaleString('pt-BR')} IFC
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expira: {new Date(listing.expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Você não tem anúncios ativos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {listings && listings.filter(l => l.status === 'sold').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
            <CardDescription>
              Cartas que você vendeu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {listings
                .filter(l => l.status === 'sold')
                .map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{listing.card?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Vendido em {listing.sold_at && new Date(listing.sold_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="font-bold text-green-600">
                      +{listing.price.toLocaleString('pt-BR')} IFC
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
