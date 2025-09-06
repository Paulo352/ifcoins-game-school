import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Users, Clock, Award, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TeacherDashboard() {
  const { profile } = useAuth();

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

  if (!profile || profile.role !== 'teacher') return null;

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
              
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Calendar className="h-6 w-6 mb-2 text-purple-600" />
                <p className="font-medium text-sm">Eventos</p>
                <p className="text-xs text-muted-foreground">Ver e criar eventos</p>
              </div>
              
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <TrendingUp className="h-6 w-6 mb-2 text-orange-600" />
                <p className="font-medium text-sm">Rankings</p>
                <p className="text-xs text-muted-foreground">Ver classificações</p>
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

      {/* Tips */}
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
    </div>
  );
}