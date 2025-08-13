
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CollectibleCard } from '@/components/ui/collectible-card';
import { CoinBalance } from '@/components/ui/coin-balance';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Loader2 } from 'lucide-react';

export function CardShop() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: cards, isLoading, refetch } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('available', true)
        .order('rarity', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleBuyCard = async (cardId: string, cardName: string, price: number) => {
    if (!profile) return;

    if (profile.coins < price) {
      toast({
        title: "Moedas insuficientes",
        description: `Você precisa de ${price} IFCoins para comprar esta carta`,
        variant: "destructive",
      });
      return;
    }

    setLoading(cardId);

    try {
      const { data, error } = await supabase.rpc('buy_card', {
        card_id: cardId,
        user_id: profile.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (result.success) {
        toast({
          title: "Carta comprada!",
          description: `Você adquiriu: ${cardName}`,
        });
        await refreshProfile();
        refetch();
      } else {
        toast({
          title: "Erro na compra",
          description: result.error || "Não foi possível comprar a carta",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao comprar carta:', error);
      toast({
        title: "Erro na compra",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loja IFCoins</h1>
          <p className="text-gray-600 mt-1">
            Compre cartas colecionáveis do IFPR
          </p>
        </div>
        <CoinBalance balance={profile.coins} showAnimation />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards?.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CollectibleCard
                  card={{
                    id: card.id,
                    name: card.name,
                    rarity: card.rarity,
                    imageUrl: card.image_url || '/placeholder.svg',
                    available: card.available,
                    price: card.price,
                    description: card.description || ''
                  }}
                  className="h-48"
                />
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-lg mb-2">{card.name}</CardTitle>
                <CardDescription className="mb-4 text-sm">
                  {card.description}
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">
                      {card.price} IFCoins
                    </span>
                    <span className="text-sm text-gray-500">
                      {(card.copies_available ?? 'ilimitadas')} disponíveis
                    </span>
                  </div>
                  <Button
                    onClick={() => handleBuyCard(card.id, card.name, card.price)}
                    disabled={
                      loading === card.id ||
                      (card.copies_available !== null && card.copies_available !== undefined && card.copies_available <= 0) ||
                      profile.coins < card.price
                    }
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {loading === card.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {loading === card.id ? 'Comprando...' : 'Comprar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
