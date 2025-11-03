import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketListings, useBuyMarketItem } from '@/hooks/market/useMarket';
import { Search, ShoppingCart, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const rarityLabels: Record<string, string> = {
  common: 'Comum',
  rare: 'Rara',
  legendary: 'Lendária',
  mythic: 'Mítica'
};

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  legendary: 'bg-purple-500',
  mythic: 'bg-orange-500'
};

export function IFMarket() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);

  const { data: listings, isLoading } = useMarketListings({
    rarity: rarityFilter || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    search: search || undefined
  });

  const buyItem = useBuyMarketItem();

  const handleBuy = (listingId: string) => {
    if (!user) {
      alert('Você precisa estar logado para comprar');
      return;
    }
    
    if (confirm('Confirmar compra? As moedas serão deduzidas do seu saldo.')) {
      buyItem.mutate({ listingId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">IFMarket</h2>
        <p className="text-muted-foreground">
          Marketplace de cartas - Compre e venda suas cartas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar carta..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Raridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="common">Comum</SelectItem>
                <SelectItem value="rare">Rara</SelectItem>
                <SelectItem value="legendary">Lendária</SelectItem>
                <SelectItem value="mythic">Mítica</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Preço mín"
                value={minPrice || ''}
                onChange={(e) => setMinPrice(parseInt(e.target.value) || 0)}
              />
              <Input
                type="number"
                placeholder="Preço máx"
                value={maxPrice || ''}
                onChange={(e) => setMaxPrice(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {listing.card?.image_url ? (
                  <img
                    src={listing.card.image_url}
                    alt={listing.card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sem imagem
                  </div>
                )}
                <Badge className={`absolute top-2 right-2 ${rarityColors[listing.card?.rarity || 'common']}`}>
                  {rarityLabels[listing.card?.rarity || 'common']}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{listing.card?.name}</CardTitle>
                <CardDescription>
                  Vendedor: {listing.seller?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Preço:</span>
                  <span className="text-2xl font-bold text-ifpr-green">
                    {listing.price.toLocaleString('pt-BR')} IFC
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Expira em: {new Date(listing.expires_at).toLocaleDateString('pt-BR')}
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleBuy(listing.id)}
                  disabled={buyItem.isPending || listing.seller_id === user?.id}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {listing.seller_id === user?.id ? 'Seu anúncio' : 'Comprar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Nenhum anúncio encontrado com os filtros selecionados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
