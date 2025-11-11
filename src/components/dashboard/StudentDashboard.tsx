
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CoinBalance } from '@/components/ui/coin-balance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardDisplay } from '@/components/cards/CardDisplay';
import { Gift, BookOpen, Users, Trophy, Calendar, Loader2, Bot } from 'lucide-react';
import { RankDisplay } from './RankDisplay';

interface StudentDashboardProps {
  onSectionChange: (section: string) => void;
}

export function StudentDashboard({ onSectionChange }: StudentDashboardProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Escutar mudanças em tempo real para atualizar dados do estudante
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`student-updates-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reward_logs',
          filter: `student_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('🔄 Nova recompensa recebida:', payload);
          // Atualizar recompensas recentes
          queryClient.invalidateQueries({ queryKey: ['student-recent-rewards', profile.id] });
          // Perfil já será atualizado pelo useAuthState com realtime
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_cards',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('🔄 Cartas atualizadas:', payload);
          // Atualizar cartas do usuário
          queryClient.invalidateQueries({ queryKey: ['user-cards', profile.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  const { data: userCards, isLoading } = useQuery({
    queryKey: ['user-cards', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          *,
          card:cards(*)
        `)
        .eq('user_id', profile.id)
        .order('acquired_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile && profile.role === 'student',
  });

  const { data: recentRewards } = useQuery({
    queryKey: ['student-recent-rewards', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('reward_logs')
        .select(`
          *,
          teacher:profiles!reward_logs_teacher_id_fkey(name)
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile && profile.role === 'student',
  });

  const { data: userRanking } = useQuery({
    queryKey: ['user-ranking', profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, coins')
        .order('coins', { ascending: false });
      
      if (error) throw error;
      
      const position = data.findIndex(p => p.id === profile.id) + 1;
      return { position, total: data.length };
    },
    enabled: !!profile && profile.role === 'student',
  });

  if (!profile || profile.role !== 'student') return null;

  const totalCards = userCards?.reduce((acc, card) => acc + card.quantity, 0) || 0;
  const totalRewardCoins = recentRewards?.reduce((acc, reward) => acc + reward.coins, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {profile.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {profile.class && `Turma: ${profile.class}`} {profile.ra && `• RA: ${profile.ra}`}
          </p>
        </div>
        <CoinBalance balance={profile.coins} showAnimation />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSectionChange('shop')}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-ifpr-green" />
              <CardTitle className="text-lg">Loja</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Compre cartas e pacotes especiais</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSectionChange('collection')}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-ifpr-blue" />
              <CardTitle className="text-lg">Coleção</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{totalCards} cartas coletadas</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSectionChange('ai-tutor')}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">IA Tutor</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Ajuda personalizada e dicas de estudo</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSectionChange('rankings')}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Rankings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {userRanking ? `${userRanking.position}º de ${userRanking.total}` : 'Sua posição no ranking'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rank Display */}
      <RankDisplay />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Suas Cartas Recentes
            </CardTitle>
            <CardDescription>
              Suas últimas cartas adquiridas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : userCards && userCards.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userCards.map((userCard) => (
                  <div key={userCard.id} className="relative">
                    <CardDisplay
                      card={{
                        id: userCard.card.id,
                        name: userCard.card.name,
                        rarity: userCard.card.rarity,
                        imageUrl: userCard.card.image_url || '',
                        available: userCard.card.available,
                        price: userCard.card.price,
                        description: userCard.card.description || '',
                        quantity: userCard.quantity
                      }}
                      showQuantity
                      className="h-32"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Você ainda não possui cartas</p>
                <Button 
                  className="mt-4 bg-ifpr-green hover:bg-ifpr-green-dark"
                  onClick={() => onSectionChange('shop')}
                >
                  Ir para a Loja
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recompensas Recentes
            </CardTitle>
            <CardDescription>
              IFCoins recebidos recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRewards && recentRewards.length > 0 ? (
                recentRewards.map((reward) => (
                  <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{reward.reason}</p>
                      <p className="text-xs text-gray-600">por {reward.teacher.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ifpr-green">+{reward.coins}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(reward.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600">Nenhuma recompensa recente</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Participe mais das atividades para ganhar IFCoins!
                  </p>
                </div>
              )}
            </div>
            {recentRewards && recentRewards.length > 0 && (
              <div className="mt-4 p-3 bg-ifpr-green/10 rounded-lg">
                <p className="text-sm font-medium text-ifpr-green">
                  Total recebido: {totalRewardCoins} IFCoins
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Como Ganhar Mais IFCoins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <h3 className="font-bold mb-2">📚 Participe das Aulas</h3>
              <p className="text-sm opacity-90">
                Seja ativo, faça perguntas e participe das atividades. Professores podem dar até 50 IFCoins!
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <h3 className="font-bold mb-2">📝 Entregue Tarefas</h3>
              <p className="text-sm opacity-90">
                Cumpra prazos e faça trabalhos de qualidade para receber recompensas dos professores.
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <h3 className="font-bold mb-2">🏆 Eventos Especiais</h3>
              <p className="text-sm opacity-90">
                Participe de eventos do IFPR para ganhar bonificações especiais em IFCoins.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
