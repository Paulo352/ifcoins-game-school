import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NewCard } from './NewCard';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface UserCardData {
  id: string;
  user_id: string;
  card_id: string;
  quantity: number;
  acquired_at: string;
  card: {
    id: string;
    name: string;
    rarity: 'common' | 'rare' | 'legendary' | 'mythic';
    image_url: string | null;
    price: number;
    description: string | null;
    available: boolean;
  };
}

export function NewCollection() {
  const { profile } = useAuth();

  const { data: userCards, isLoading } = useQuery({
    queryKey: ['user-collection', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      console.log('🃏 Fetching user collection for:', profile.id);
      
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          id,
          user_id,
          card_id,
          quantity,
          acquired_at,
          card:cards (
            id,
            name,
            rarity,
            image_url,
            price,
            description,
            available
          )
        `)
        .eq('user_id', profile.id)
        .order('acquired_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user collection:', error);
        throw error;
      }

      console.log('✅ User collection fetched:', data?.length, 'cards');
      return data as UserCardData[];
    },
    enabled: !!profile?.id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userCards || userCards.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Coleção vazia</h3>
          <p className="text-muted-foreground mb-4">
            Você ainda não possui nenhuma carta.
          </p>
          <p className="text-sm text-muted-foreground">
            Visite a loja para comprar suas primeiras cartas!
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalCards = userCards.reduce((sum, userCard) => sum + userCard.quantity, 0);
  const uniqueCards = userCards.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Minha Coleção</h1>
        <p className="text-gray-600 mt-1">
          {totalCards} cartas • {uniqueCards} tipos únicos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {userCards.map((userCard) => (
          <NewCard
            key={userCard.id}
            card={{
              id: userCard.card.id,
              name: userCard.card.name,
              rarity: userCard.card.rarity,
              image_url: userCard.card.image_url,
              price: userCard.card.price,
              description: userCard.card.description,
              quantity: userCard.quantity,
              available: userCard.card.available,
            }}
            showQuantity
            className="relative"
          />
        ))}
      </div>
    </div>
  );
}