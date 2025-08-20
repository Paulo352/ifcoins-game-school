import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CoinBalance } from '@/components/ui/coin-balance';
import { CardDisplay } from './CardDisplay';
import { useAvailableCards } from '@/hooks/cards/useCards';
import { useCardPurchase } from '@/hooks/cards/useCardPurchase';
import { ShoppingCart, Loader2 } from 'lucide-react';

export function CardShop() {
  const { profile, refreshProfile } = useAuth();
  const { data: cards, isLoading, error, refetch } = useAvailableCards();
  const { buyCard, loading } = useCardPurchase();

  const handlePurchase = async (cardId: string, cardName: string) => {
    if (!profile) return;

    await buyCard(profile.id, cardId, cardName, async () => {
      await refreshProfile();
      refetch();
    });
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loja IFCoins</h1>
          <p className="text-muted-foreground mt-1">
            Compre cartas colecionáveis do IFPR
          </p>
        </div>
        <CoinBalance balance={profile.coins} showAnimation />
      </div>

      {/* Estado de erro da loja */}
      {error && (
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive">
          Ocorreu um erro ao carregar a loja. Tente novamente.
          <div className="mt-3">
            <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !error && (
        cards && cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card) => (
              <div key={card.id} className="space-y-4">
                <CardDisplay
                  card={{
                    id: card.id,
                    name: card.name,
                    rarity: card.rarity,
                    imageUrl: card.image_url || '/placeholder.svg',
                    available: card.available,
                    price: card.price,
                    description: card.description || ''
                  }}
                  showPrice
                  className="h-full"
                />
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {card.copies_available === null ? 'ilimitadas' : card.copies_available} disponíveis
                    </span>
                  </div>
                  <Button
                    onClick={() => handlePurchase(card.id, card.name)}
                    disabled={
                      loading === card.id ||
                      (card.copies_available !== null && card.copies_available <= 0) ||
                      profile.coins < card.price
                    }
                    className="w-full"
                  >
                    {loading === card.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {loading === card.id ? 'Comprando...' : 'Comprar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Nenhuma carta disponível no momento.</div>
        )
      )}
    </div>
  );
}
