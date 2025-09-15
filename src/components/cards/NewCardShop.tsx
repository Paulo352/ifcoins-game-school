import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvailableCards } from '@/hooks/useNewCards';
import { useCardPurchase } from '@/hooks/cards/useCardPurchase';
import { NewCard } from './NewCard';
import { PackShop } from '../packs/PackShop';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Package } from 'lucide-react';

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
        <h1 className="text-3xl font-bold text-gray-900">Loja</h1>
        <p className="text-gray-600 mt-1">
          Compre cartas e pacotes usando seus IFCoins
        </p>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Cartas Individuais
          </TabsTrigger>
          <TabsTrigger value="packs" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Pacotes de Cartas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-6">
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
        </TabsContent>

        <TabsContent value="packs" className="mt-6">
          <PackShop />
        </TabsContent>
      </Tabs>
    </div>
  );
}