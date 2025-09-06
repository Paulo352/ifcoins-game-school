import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvailableCards } from '@/hooks/useNewCards';
import { useCardPurchase } from '@/hooks/cards/useCardPurchase';
import { NewCard } from './NewCard';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export function NewCardShop() {
  const { profile } = useAuth();
  const { data: cards, isLoading } = useAvailableCards();
  const { buyCard, loading: purchasing } = useCardPurchase();

  const handleBuyCard = async (cardId: string) => {
    if (!profile) return;
    
    const card = cards?.find(c => c.id === cardId);
    const cardName = card?.name || 'Carta';
    
    await buyCard(profile.id, cardId, cardName, () => {
      // Refresh user profile to update coins
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Loja vazia</h3>
          <p className="text-muted-foreground">
            Não há cartas disponíveis para compra no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loja de Cartas</h1>
        <p className="text-gray-600 mt-1">
          Compre cartas usando seus IFCoins
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <NewCard
            key={card.id}
            card={card}
            onBuy={handleBuyCard}
            showPrice
            showActions
          />
        ))}
      </div>
    </div>
  );
}