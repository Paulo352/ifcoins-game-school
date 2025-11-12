import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Star, TrendingUp, Award, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function MentorshipDashboard() {
  const { profile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['mentorship-stats'],
    queryFn: async () => {
      const { data: mentorships, error: mentorshipsError } = await supabase
        .from('mentorships')
        .select('*');

      if (mentorshipsError) throw mentorshipsError;

      const { data: activities, error: activitiesError } = await supabase
        .from('mentorship_activities')
        .select('*');

      if (activitiesError) throw activitiesError;

      const { data: reviews, error: reviewsError } = await supabase
        .from('mentorship_reviews')
        .select('*');

      if (reviewsError) throw reviewsError;

      const active = mentorships.filter(m => m.status === 'active').length;
      const completed = mentorships.filter(m => m.status === 'completed').length;
      const pending = mentorships.filter(m => m.status === 'pending').length;
      const totalActivities = activities.length;
      const totalCoinsDistributed = activities.reduce((sum, a) => sum + a.coins_earned, 0);
      const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

      return {
        total: mentorships.length,
        active,
        completed,
        pending,
        totalActivities,
        totalCoinsDistributed,
        avgRating,
        reviews: reviews.length,
      };
    },
    enabled: profile?.role === 'admin',
  });

  const { data: topMentors } = useQuery({
    queryKey: ['top-mentors'],
    queryFn: async () => {
      const { data: mentorships, error } = await supabase
        .from('mentorships')
        .select(`
          mentor_id,
          status,
          mentor:profiles!mentorships_mentor_id_fkey(name)
        `)
        .eq('status', 'completed');

      if (error) throw error;

      const mentorCounts = mentorships.reduce((acc: any, m) => {
        const mentorId = m.mentor_id;
        if (!acc[mentorId]) {
          acc[mentorId] = {
            mentor_id: mentorId,
            name: m.mentor?.name || 'Desconhecido',
            count: 0,
          };
        }
        acc[mentorId].count += 1;
        return acc;
      }, {});

      return Object.values(mentorCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);
    },
    enabled: profile?.role === 'admin',
  });

  const { data: activeMentorships } = useQuery({
    queryKey: ['active-mentorships-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentorships')
        .select(`
          *,
          mentor:profiles!mentorships_mentor_id_fkey(name),
          mentee:profiles!mentorships_mentee_id_fkey(name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin',
  });

  if (profile?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Negado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Apenas administradores podem acessar este dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Mentoria</h1>
        <p className="text-muted-foreground mt-1">
          Estatísticas e relatórios do sistema de mentoria
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Mentorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pending || 0} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.totalActivities || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalCoinsDistributed || 0} moedas distribuídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Avaliação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.avgRating || 0} ⭐
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.reviews || 0} avaliações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Mentors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top 5 Mentores
          </CardTitle>
          <CardDescription>
            Mentores com mais mentorias concluídas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topMentors?.map((mentor: any, index) => (
              <div key={mentor.mentor_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{mentor.name}</p>
                    <p className="text-sm text-muted-foreground">{mentor.count} mentorias concluídas</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1" />
                  Mentor Ativo
                </Badge>
              </div>
            ))}
            {(!topMentors || topMentors.length === 0) && (
              <p className="text-center text-muted-foreground py-4">Nenhum mentor ainda</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Mentorships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mentorias Ativas
          </CardTitle>
          <CardDescription>
            Últimas 10 mentorias em andamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeMentorships?.map((mentorship) => (
              <div key={mentorship.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {mentorship.mentor?.name} → {mentorship.mentee?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Iniciada em {new Date(mentorship.started_at || mentorship.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge>Ativa</Badge>
              </div>
            ))}
            {(!activeMentorships || activeMentorships.length === 0) && (
              <p className="text-center text-muted-foreground py-4">Nenhuma mentoria ativa</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
