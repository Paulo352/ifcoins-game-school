
import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Crown, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function Rankings() {
  const queryClient = useQueryClient();

  // Escutar mudanças em tempo real para atualizar rankings
  useEffect(() => {
    const channel = supabase
      .channel('rankings-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('🔄 Perfil atualizado, atualizando rankings:', payload);
          // Atualizar rankings quando houver mudanças nas moedas
          queryClient.invalidateQueries({ queryKey: ['rankings'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_cards',
        },
        (payload) => {
          console.log('🔄 Cartas atualizadas, atualizando rankings:', payload);
          // Atualizar rankings de cartas
          queryClient.invalidateQueries({ queryKey: ['card-rankings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  const { data: rankings, isLoading } = useQuery({
    queryKey: ['rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rankings_secure')
        .select('*')
        .order('coins', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: cardRankings } = useQuery({
    queryKey: ['card-rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          user_id,
          profiles!inner(name, role),
          total_cards:quantity
        `)
        .eq('profiles.role', 'student')
        .order('quantity', { ascending: false });
      
      if (error) throw error;
      
      // Agrupar por usuário e somar total de cartas
      const userCardCounts = data.reduce((acc, item) => {
        const userId = item.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user: item.profiles,
            totalCards: 0
          };
        }
        acc[userId].totalCards += item.total_cards;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(userCardCounts)
        .sort((a: any, b: any) => b.totalCards - a.totalCards)
        .slice(0, 5);
    },
  });

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Carregando rankings...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rankings IFCoins</h1>
        <p className="text-muted-foreground mt-1">
          Confira o Top 5 de estudantes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              Top 5 - IFCoins
            </CardTitle>
            <CardDescription>
              Top 5 estudantes com mais moedas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings?.map((user, index) => (
                <div key={user.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    {getPositionIcon(index + 1)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">
                      {user.coins}
                    </p>
                    <p className="text-xs text-muted-foreground">IFCoins</p>
                  </div>
                </div>
              ))}
              {(!rankings || rankings.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Nenhum estudante no ranking ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-600" />
              Top 5 - Cartas
            </CardTitle>
            <CardDescription>
              Top 5 estudantes com mais cartas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cardRankings?.map((item: any, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    {getPositionIcon(index + 1)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600 text-lg">
                      {item.totalCards}
                    </p>
                    <p className="text-xs text-muted-foreground">Cartas</p>
                  </div>
                </div>
              ))}
              {(!cardRankings || cardRankings.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Nenhum estudante no ranking ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como Subir no Ranking</CardTitle>
          <CardDescription>Dicas para ganhar mais IFCoins e cartas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Participação nas Aulas</h3>
              <p className="text-sm text-blue-700">
                Seja ativo e participe das atividades. Professores podem dar até 50 moedas por participação.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Compre Cartas</h3>
              <p className="text-sm text-green-700">
                Use suas moedas na loja para comprar cartas especiais e subir no ranking de coleção.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Eventos Especiais</h3>
              <p className="text-sm text-purple-700">
                Participe de eventos do IFPR para ganhar multiplicadores de moedas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
