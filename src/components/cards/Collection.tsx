import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardDisplay } from './CardDisplay';
import { useUserCards, useCards } from '@/hooks/cards/useCards';
import { Loader2, Trophy, Star, Gem, Crown } from 'lucide-react';

const rarityIcons = {
  common: Star,
  rare: Gem,
  legendary: Trophy,
  mythic: Crown
};

const rarityLabels = {
  common: 'Comuns',
  rare: 'Raros',
  legendary: 'Lendários',
  mythic: 'Míticos'
};

export function Collection() {
  const { profile } = useAuth();
  const { data: userCards, isLoading: loadingUserCards } = useUserCards(profile?.id);
  const { data: allCards, isLoading: loadingAllCards } = useCards();

  const isLoading = loadingUserCards || loadingAllCards;

  if (!profile) return null;

  // Calcular estatísticas
  const totalCards = allCards?.length || 0;
  const ownedCards = userCards?.length || 0;
  const completionPercentage = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;

  // Estatísticas por raridade
  const rarityStats = allCards?.reduce((acc, card) => {
    const userCard = userCards?.find(uc => uc.card_id === card.id);
    const owned = userCard ? userCard.quantity : 0;
    
    if (!acc[card.rarity]) {
      acc[card.rarity] = { total: 0, owned: 0 };
    }
    
    acc[card.rarity].total += 1;
    if (owned > 0) {
      acc[card.rarity].owned += 1;
    }
    
    return acc;
  }, {} as Record<string, { total: number; owned: number }>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minha Coleção</h1>
        <p className="text-muted-foreground mt-1">
          Suas cartas colecionáveis do IFPR
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Cartas</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ownedCards}</div>
                <p className="text-xs text-muted-foreground">
                  de {totalCards} disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conclusão</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionPercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  da coleção completa
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cartas Únicas</CardTitle>
                <Gem className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userCards?.reduce((sum, card) => sum + card.quantity, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  total de exemplares
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas por raridade */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(rarityStats || {}).map(([rarity, stats]) => {
              const Icon = rarityIcons[rarity as keyof typeof rarityIcons];
              return (
                <Card key={rarity}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {rarityLabels[rarity as keyof typeof rarityLabels]}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.owned}</div>
                    <p className="text-xs text-muted-foreground">
                      de {stats.total} disponíveis
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Lista de cartas */}
          {userCards && userCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userCards.map((userCard) => (
                <CardDisplay
                  key={userCard.id}
                  card={{
                    id: userCard.card.id,
                    name: userCard.card.name,
                    rarity: userCard.card.rarity,
                    imageUrl: userCard.card.image_url || '/placeholder.svg',
                    available: userCard.card.available,
                    price: userCard.card.price,
                    description: userCard.card.description || '',
                    quantity: userCard.quantity
                  }}
                  showQuantity
                  className="h-full"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma carta encontrada</CardTitle>
                <CardDescription>
                  Você ainda não possui cartas em sua coleção. Visite a loja para comprar suas primeiras cartas!
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      )}
    </div>
  );
}