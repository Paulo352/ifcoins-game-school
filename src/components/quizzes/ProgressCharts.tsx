import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function ProgressCharts() {
  const { user } = useAuth();

  const { data: badgeProgress, isLoading: loadingBadges } = useQuery({
    queryKey: ['badge-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_quiz_badges')
        .select('*, quiz_badges(*)')
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: true });
      
      if (error) throw error;

      // Group by month
      const monthlyData = data.reduce((acc: any, badge: any) => {
        const month = new Date(badge.earned_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { month, badges: 0 };
        }
        acc[month].badges++;
        return acc;
      }, {});

      return Object.values(monthlyData);
    },
    enabled: !!user?.id
  });

  const { data: matchProgress, isLoading: loadingMatches } = useQuery({
    queryKey: ['match-progress', user?.id],
    queryFn: async () => {
      const { data: participations } = await supabase
        .from('quiz_room_players')
        .select('room_id')
        .eq('user_id', user?.id);
      
      const roomIds = participations?.map(p => p.room_id) || [];
      
      const { data, error } = await (supabase as any)
        .from('multiplayer_match_history')
        .select('*')
        .in('room_id', roomIds)
        .order('finished_at', { ascending: true });
      
      if (error) throw error;

      // Group by week
      const weeklyData = data.reduce((acc: any, match: any) => {
        const week = new Date(match.finished_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
        if (!acc[week]) {
          acc[week] = { week, matches: 0, wins: 0 };
        }
        acc[week].matches++;
        if (match.winner_id === user?.id) {
          acc[week].wins++;
        }
        return acc;
      }, {});

      return Object.values(weeklyData);
    },
    enabled: !!user?.id
  });

  const { data: quizScores, isLoading: loadingScores } = useQuery({
    queryKey: ['quiz-scores', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('score, completed_at')
        .eq('user_id', user?.id)
        .eq('is_completed', true)
        .order('completed_at', { ascending: true })
        .limit(20);
      
      if (error) throw error;

      return data.map((attempt: any, index: number) => ({
        attempt: index + 1,
        score: attempt.score
      }));
    },
    enabled: !!user?.id
  });

  if (loadingBadges || loadingMatches || loadingScores) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Gráficos de Evolução</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Badge Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Badges Conquistadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badgeProgress && badgeProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={badgeProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="badges" fill="hsl(var(--primary))" name="Badges" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Nenhuma badge conquistada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Desempenho Multiplayer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matchProgress && matchProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={matchProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="matches" stroke="hsl(var(--primary))" name="Partidas" />
                  <Line type="monotone" dataKey="wins" stroke="hsl(142, 76%, 36%)" name="Vitórias" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Nenhuma partida jogada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Scores Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Evolução de Pontuação em Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            {quizScores && quizScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={quizScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" label={{ value: 'Tentativas', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Pontuação', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Pontuação"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Nenhum quiz completado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
