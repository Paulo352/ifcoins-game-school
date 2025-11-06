import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TopCard {
  card_id: string;
  card_name: string;
  rarity: string;
  total_owned: number;
  owners_count: number;
  image_url?: string;
}

export function TopCards() {
  const { data: topCards, isLoading } = useQuery({
    queryKey: ['top-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          card_id,
          quantity,
          cards (
            name,
            rarity,
            image_url
          )
        `);

      if (error) throw error;

      // Agrupar por carta
      const cardMap = new Map<string, TopCard>();
      
      data?.forEach((item: any) => {
        if (!item.cards) return;
        
        const cardId = item.card_id;
        if (!cardMap.has(cardId)) {
          cardMap.set(cardId, {
            card_id: cardId,
            card_name: item.cards.name,
            rarity: item.cards.rarity,
            total_owned: 0,
            owners_count: 0,
            image_url: item.cards.image_url,
          });
        }
        
        const card = cardMap.get(cardId)!;
        card.total_owned += item.quantity;
        card.owners_count += 1;
      });

      // Converter para array e ordenar
      const topCardsList = Array.from(cardMap.values())
        .sort((a, b) => b.total_owned - a.total_owned)
        .slice(0, 10);

      return topCardsList;
    },
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'mythic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      case 'rare': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'mythic': return 'bg-purple-50';
      case 'legendary': return 'bg-yellow-50';
      case 'rare': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 10 Cartas Mais Colecionadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top 10 Cartas Mais Colecionadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!topCards || topCards.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma carta foi coletada ainda
          </p>
        ) : (
          <div className="space-y-3">
            {topCards.map((card, index) => (
              <div
                key={card.card_id}
                className={`flex items-center gap-4 p-3 rounded-lg ${getRarityBg(card.rarity)}`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white font-bold text-sm">
                  {index + 1}
                </div>
                
                {card.image_url && (
                  <img
                    src={card.image_url}
                    alt={card.card_name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{card.card_name}</p>
                  <p className={`text-sm capitalize ${getRarityColor(card.rarity)}`}>
                    {card.rarity}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-lg">{card.total_owned}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.owners_count} colecionador{card.owners_count !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
