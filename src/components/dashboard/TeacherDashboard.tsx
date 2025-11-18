import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Users, Clock, Award, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QuizReports } from '@/components/quizzes/QuizReports';
import { TeacherClassDashboard } from '@/components/teacher/TeacherClassDashboard';

export function TeacherDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showQuizReports, setShowQuizReports] = useState(false);

  // Escutar mudanças em tempo real para atualizar dados do professor
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`teacher-updates-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reward_logs',
          filter: `teacher_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('🔄 Nova recompensa dada:', payload);
          // Atualizar estatísticas do professor
          queryClient.invalidateQueries({ queryKey: ['today-rewards', profile.id] });
          queryClient.invalidateQueries({ queryKey: ['weekly-rewards', profile.id] });
          queryClient.invalidateQueries({ queryKey: ['recent-rewards', profile.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('🔄 Perfis atualizados:', payload);
          // Atualizar contagem de estudantes se necessário
          queryClient.invalidateQueries({ queryKey: ['students-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  const { data: students } = useQuery({
    queryKey: ['students-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student');
      
      if (error) throw error;
      return data.length;
    },
    enabled: profile?.role === 'teacher',
  });

  const { data: todayRewards } = useQuery({
    queryKey: ['today-rewards', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('reward_logs')
        .select('*')
        .eq('teacher_id', profile.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'teacher',
  });

  const { data: weeklyRewards } = useQuery({
    queryKey: ['weekly-rewards', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('reward_logs')
        .select('*')
        .eq('teacher_id', profile.id)
        .gte('created_at', weekAgo.toISOString());
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'teacher',
  });

  const { data: recentRewards } = useQuery({
    queryKey: ['teacher-recent-rewards', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('reward_logs')
        .select(`
          *,
          student:profiles!reward_logs_student_id_fkey(name)
        `)
        .eq('teacher_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'teacher',
  });

  const { data: cardRankings } = useQuery({
    queryKey: ['card-rankings-teacher'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          user_id,
          quantity,
          profiles!inner(id, name, role)
        `)
        .eq('profiles.role', 'student');
      
      if (error) throw error;
      
      // Agrupar por usuário e somar total de cartas
      const userCardCounts = data.reduce((acc: any, card: any) => {
        const userId = card.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            name: card.profiles.name,
            total_cards: 0,
          };
        }
        acc[userId].total_cards += card.quantity;
        return acc;
      }, {});

      return Object.values(userCardCounts)
        .sort((a: any, b: any) => b.total_cards - a.total_cards);
    },
  });

  if (!profile || profile.role !== 'teacher') return null;

  if (showQuizReports) {
    return <QuizReports onBack={() => setShowQuizReports(false)} />;
  }

  const todayCoinsGiven = todayRewards?.reduce((acc, reward) => acc + reward.coins, 0) || 0;
  const todayStudentsRewarded = new Set(todayRewards?.map(r => r.student_id)).size;
  const weeklyCoinsGiven = weeklyRewards?.reduce((acc, reward) => acc + reward.coins, 0) || 0;
  const averageCoinsPerDay = Math.round(weeklyCoinsGiven / 7);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Painel do Professor
        </h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo, {profile.name}. Aqui está um resumo da sua atividade.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moedas Hoje
              </CardTitle>
              <Coins className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{todayCoinsGiven}</div>
            <p className="text-xs text-muted-foreground">
              Para {todayStudentsRewarded} estudantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estudantes Total
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{students || 0}</div>
            <p className="text-xs text-muted-foreground">
              No sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média Semanal
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{averageCoinsPerDay}</div>
            <p className="text-xs text-muted-foreground">
              Moedas/dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Limite Diário
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">500</div>
            <p className="text-xs text-muted-foreground">
              Por transação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Navegue rapidamente para as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Users className="h-6 w-6 mb-2 text-blue-600" />
                <p className="font-medium text-sm">Gerenciar Estudantes</p>
                <p className="text-xs text-muted-foreground">Dar moedas com motivos pré-definidos</p>
              </div>
              
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Coins className="h-6 w-6 mb-2 text-green-600" />
                <p className="font-medium text-sm">Dar Moedas</p>
                <p className="text-xs text-muted-foreground">Para casos especiais</p>
              </div>
              
              <a href="#rankings" className="block">
                <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <Calendar className="h-6 w-6 mb-2 text-purple-600" />
                  <p className="font-medium text-sm">Rankings</p>
                  <p className="text-xs text-muted-foreground">Ver classificações de estudantes</p>
                </div>
              </a>
              
              <div 
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setShowQuizReports(true)}
              >
                <TrendingUp className="h-6 w-6 mb-2 text-orange-600" />
                <p className="font-medium text-sm">Relatórios de Quiz</p>
                <p className="text-xs text-muted-foreground">Ver desempenho dos alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Suas últimas recompensas entregues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRewards && recentRewards.length > 0 ? (
                recentRewards.map((reward, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{reward.student?.name || 'Estudante'}</p>
                      <p className="text-xs text-muted-foreground">{reward.reason}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-green-600">
                        +{reward.coins}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(reward.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Award className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Nenhuma recompensa ainda</p>
                  <p className="text-xs">Comece recompensando seus estudantes!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conditional rendering: Show Quiz Reports or Dashboard */}
      {showQuizReports ? (
        <QuizReports onBack={() => setShowQuizReports(false)} />
      ) : (
        <>
          {/* Class Dashboard */}
          {/* TeacherClassDashboard e Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeacherClassDashboard />
            
            {/* Ranking de Cartas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top 5 - Colecionadores
                </CardTitle>
                <CardDescription>
                  Alunos com mais cartas coletadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cardRankings && cardRankings.length > 0 ? (
                  <div className="space-y-3">
                    {cardRankings.slice(0, 5).map((rank: any, index: number) => (
                      <div key={rank.user_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-amber-600' :
                            'bg-gray-300'
                          }`}>
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{rank.student_name || 'Aluno'}</p>
                            <p className="text-xs text-muted-foreground">
                              {rank.total_cards} {rank.total_cards === 1 ? 'carta' : 'cartas'}
                            </p>
                          </div>
                        </div>
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Trophy className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Nenhuma carta coletada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tips Section */}
          <Card>
            <CardHeader>
              <CardTitle>💡 Dicas para Professores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Gerenciar Estudantes</h4>
                  <p className="text-sm text-blue-700">
                    Use motivos pré-definidos para recompensas rápidas e consistentes.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Dar Moedas Especiais</h4>
                  <p className="text-sm text-green-700">
                    Reserve para atividades extracurriculares e casos únicos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
