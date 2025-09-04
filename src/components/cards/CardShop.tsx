import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingCart, Loader2, RefreshCw } from 'lucide-react';
import { useAvailableCards } from '@/hooks/cards/useCards';
import { useCardPurchase } from '@/hooks/cards/useCardPurchase';
import { toast } from '@/hooks/use-toast';

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  legendary: 'bg-purple-500',
  mythic: 'bg-yellow-500'
};

const rarityLabels = {
  common: 'Comum',
  rare: 'Rara',
  legendary: 'Lendária',
  mythic: 'Mítica'
};

export function CardShop() {
  const { profile, refreshProfile } = useAuth();
  const { data: cards, isLoading, error, refetch } = useAvailableCards();
  const { buyCard, loading } = useCardPurchase();

  const handlePurchase = async (cardId: string, cardName: string, price: number) => {
    if (!profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comprar cartas.",
        variant: "destructive",
      });
      return;
    }

    if (profile.coins < price) {
      toast({
        title: "Saldo insuficiente",
        description: `Você precisa de ${price} IFCoins para comprar esta carta.`,
        variant: "destructive",
      });
      return;
    }

    await buyCard(profile.id, cardId, cardName, async () => {
      await refreshProfile();
      refetch();
    });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="text-muted-foreground">Você precisa estar logado para acessar a loja.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loja de Cartas IFCoins</h1>
          <p className="text-muted-foreground mt-1">
            Compre cartas colecionáveis com suas IFCoins
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2">
          <Coins className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">
            {profile.coins.toLocaleString('pt-BR')} IFCoins
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando cartas disponíveis...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar loja</CardTitle>
            <CardDescription>
              Ocorreu um erro ao carregar as cartas disponíveis. Tente novamente.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Cards Grid */}
      {!isLoading && !error && cards && (
        <>
          {cards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cards.map((card) => {
                const isOutOfStock = card.copies_available !== null && card.copies_available <= 0;
                const canAfford = profile.coins >= card.price;
                const isLoadingThisCard = loading === card.id;
                
                return (
                  <Card key={card.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="aspect-[3/4] bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
                         {card.image_url ? (
                            <img
                              src={card.image_url}
                              alt={card.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                console.error('Erro ao carregar imagem no shop:', card.image_url);
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                              onLoad={() => {
                                console.log('Imagem do shop carregada:', card.image_url);
                              }}
                            />
                        ) : (
                          <div className="text-muted-foreground text-sm">Sem imagem</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Badge 
                          className={`${rarityColors[card.rarity]} text-white`}
                        >
                          {rarityLabels[card.rarity]}
                        </Badge>
                        <CardTitle className="text-lg">{card.name}</CardTitle>
                        {card.description && (
                          <CardDescription className="line-clamp-3">
                            {card.description}
                          </CardDescription>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 pt-0">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Disponíveis:</span>
                        <span>
                          {card.copies_available === null ? 'Ilimitadas' : card.copies_available}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0 flex flex-col gap-3">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-lg font-bold flex items-center gap-1">
                          <Coins className="h-4 w-4 text-primary" />
                          {card.price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <Button
                        onClick={() => handlePurchase(card.id, card.name, card.price)}
                        disabled={isLoadingThisCard || isOutOfStock || !canAfford}
                        className="w-full"
                        variant={canAfford ? "default" : "secondary"}
                      >
                        {isLoadingThisCard ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Comprando...
                          </>
                        ) : isOutOfStock ? (
                          'Esgotada'
                        ) : !canAfford ? (
                          'Saldo insuficiente'
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Comprar
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardHeader className="text-center py-12">
                <CardTitle>Nenhuma carta disponível</CardTitle>
                <CardDescription>
                  No momento não há cartas disponíveis para compra. Volte mais tarde!
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      )}
    </div>
  );
}