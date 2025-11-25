
import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Crown, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function Rankings() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const isTeacherOrAdmin = profile?.role === 'teacher' || profile?.role === 'admin';

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
          table: 'cards',
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
    queryKey: ['rankings-coins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, coins, created_at')
        .eq('role', 'student')
        .order('coins', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: cardRankings } = useQuery({
    queryKey: ['card-rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('assigned_to')
        .not('assigned_to', 'is', null);
      
      if (error) {
        console.error('Erro ao buscar cartas:', error);
        throw error;
      }

      if (!data || data.length === 0) return [];
      
      // Agrupar por usuário e contar
      const userCardCounts = data.reduce((acc: any, card: any) => {
        const userId = card.assigned_to;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            total_cards: 0,
          };
        }
        acc[userId].total_cards += 1;
        return acc;
      }, {});

      // Buscar informações dos usuários
      const userIds = Object.keys(userCardCounts);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('id', userIds)
        .eq('role', 'student');

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      // Combinar dados
      const result = profiles?.map(profile => ({
        user_id: profile.id,
        name: profile.name,
        total_cards: userCardCounts[profile.id].total_cards
      })) || [];

      return result.sort((a: any, b: any) => b.total_cards - a.total_cards);
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
              Rankings - IFCoins
            </CardTitle>
            <CardDescription>
              Todos os estudantes ordenados por moedas
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
              Rankings - Cartas
            </CardTitle>
            <CardDescription>
              Todos os estudantes ordenados por total de cartas
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
                    <p className="font-medium text-foreground">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600 text-lg">
                      {item.total_cards}
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
