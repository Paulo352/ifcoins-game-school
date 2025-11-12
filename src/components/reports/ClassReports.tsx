import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, TrendingUp, BookOpen, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function ClassReports() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const { data: classes } = useQuery({
    queryKey: ['classes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, teacher_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos professores separadamente
      const teacherIds = [...new Set(data.map(c => c.teacher_id).filter(Boolean))];
      const { data: teachers } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', teacherIds);

      return data.map(c => ({
        ...c,
        teacherName: teachers?.find(t => t.id === c.teacher_id)?.name || 'N/A',
      }));
    },
    enabled: isAdmin,
  });

  const { data: classStats } = useQuery({
    queryKey: ['class-stats'],
    queryFn: async () => {
      if (!classes) return [];

      const statsPromises = classes.map(async (classItem) => {
        const { data: students, error: studentsError } = await supabase
          .from('class_students')
          .select('student_id')
          .eq('class_id', classItem.id);

        if (studentsError) throw studentsError;

        const studentIds = students?.map(s => s.student_id) || [];

        if (studentIds.length === 0) {
          return {
            id: classItem.id,
            name: classItem.name,
            teacher: classItem.teacherName,
            totalStudents: 0,
            avgCoins: 0,
            avgScore: 0,
            totalBadges: 0,
            totalQuizzes: 0,
            engagement: 0,
          };
        }

        // Buscar moedas dos alunos
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('coins')
          .in('id', studentIds);

        if (profilesError) throw profilesError;

        // Buscar tentativas de quiz dos alunos
        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('score, total_questions, is_completed')
          .in('user_id', studentIds)
          .eq('is_completed', true);

        if (attemptsError) throw attemptsError;

        // Buscar badges dos alunos
        const { data: badges, error: badgesError } = await supabase
          .from('user_badge_progress')
          .select('user_id')
          .in('user_id', studentIds);

        if (badgesError) throw badgesError;

        // Calcular estatísticas
        const totalStudents = students?.length || 0;
        const avgCoins = totalStudents > 0
          ? Math.round(profiles.reduce((sum, p) => sum + (p.coins || 0), 0) / totalStudents)
          : 0;
        
        const avgScore = attempts && attempts.length > 0
          ? (attempts.reduce((sum, a) => sum + (a.score / a.total_questions), 0) / attempts.length * 100).toFixed(1)
          : 0;

        const totalBadges = badges?.length || 0;
        const totalQuizzes = attempts?.length || 0;

        return {
          id: classItem.id,
          name: classItem.name,
          teacher: classItem.teacherName,
          totalStudents,
          avgCoins,
          avgScore: parseFloat(avgScore as string),
          totalBadges,
          totalQuizzes,
          engagement: totalQuizzes > 0 ? (totalQuizzes / totalStudents).toFixed(1) : 0,
        };
      });

      return Promise.all(statsPromises);
    },
    enabled: isAdmin && !!classes,
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Negado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Apenas administradores podem acessar os relatórios comparativos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios por Turma</h1>
        <p className="text-muted-foreground mt-1">
          Comparação de desempenho entre turmas
        </p>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Comparação entre Turmas
          </CardTitle>
          <CardDescription>
            Estatísticas gerais de cada turma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classStats?.map((stat) => (
              <div key={stat.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{stat.name}</h3>
                    <p className="text-sm text-muted-foreground">Professor: {stat.teacher}</p>
                  </div>
                  <Badge variant="outline">
                    {stat.totalStudents} alunos
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs text-muted-foreground">Moedas Média</span>
                    </div>
                    <p className="text-lg font-bold">{stat.avgCoins}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-muted-foreground">Score Médio</span>
                    </div>
                    <p className="text-lg font-bold">{stat.avgScore}%</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      <span className="text-xs text-muted-foreground">Total Badges</span>
                    </div>
                    <p className="text-lg font-bold">{stat.totalBadges}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-muted-foreground">Quizzes</span>
                    </div>
                    <p className="text-lg font-bold">{stat.totalQuizzes}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-muted-foreground">Engajamento</span>
                    </div>
                    <p className="text-lg font-bold">{stat.engagement}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!classStats || classStats.length === 0) && (
              <p className="text-center text-muted-foreground py-8">Nenhuma turma cadastrada ainda</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {classStats && classStats.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Moedas Médias por Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgCoins" fill="#eab308" name="Moedas Média" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score Médio e Badges por Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#3b82f6" name="Score Médio (%)" />
                  <Bar dataKey="totalBadges" fill="#a855f7" name="Total Badges" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
