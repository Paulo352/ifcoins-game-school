import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/hooks/useClasses';
import { Users, TrendingDown, BookOpen, Award, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function TeacherClassDashboard() {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const { data: classes, isLoading: loadingClasses } = useClasses();
 
  const { data: classStats, isLoading: loadingStats } = useQuery({
    queryKey: ['class-stats', selectedClassId],
    queryFn: async () => {
      // Get students from selected class or all classes
      let studentIds: string[] = [];
      
      if (selectedClassId === 'all') {
        const { data: allStudents } = await supabase
          .from('class_students')
          .select('student_id')
          .in('class_id', classes?.map(c => c.id) || []);
        studentIds = allStudents?.map(s => s.student_id) || [];
      } else {
        const { data: classStudents } = await supabase
          .from('class_students')
          .select('student_id')
          .eq('class_id', selectedClassId);
        studentIds = classStudents?.map(s => s.student_id) || [];
      }

      if (studentIds.length === 0) {
        return {
          totalStudents: 0,
          averageScore: 0,
          totalQuizzes: 0,
          studentsAtRisk: []
        };
      }

      // Get quiz attempts for these students
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('user_id, score, is_completed, completed_at')
        .in('user_id', studentIds)
        .eq('is_completed', true);

      // Get student profiles with ranks
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', studentIds);

      const { data: ranks } = await supabase
        .from('user_ranks')
        .select('*')
        .in('user_id', studentIds);

      // Calculate stats per student
      const studentStats = profiles?.map(profile => {
        const studentAttempts = attempts?.filter(a => a.user_id === profile.id) || [];
        const studentRank = ranks?.find(r => r.user_id === profile.id);
        
        const avgScore = studentAttempts.length > 0
          ? studentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / studentAttempts.length
          : 0;

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const recentActivity = studentAttempts.filter(a => 
          a.completed_at && new Date(a.completed_at) > last7Days
        ).length;

        return {
          ...profile,
          quizzesCompleted: studentAttempts.length,
          averageScore: avgScore,
          recentActivity,
          rank: studentRank?.current_rank || 'iniciante',
          totalPoints: studentRank?.total_points || 0
        };
      }) || [];

      // Identify at-risk students (low activity, low scores)
      const studentsAtRisk = studentStats.filter(s => 
        s.recentActivity === 0 || s.averageScore < 50 || s.quizzesCompleted < 3
      ).sort((a, b) => a.averageScore - b.averageScore);

      const totalScore = studentStats.reduce((sum, s) => sum + s.averageScore, 0);
      const averageScore = studentStats.length > 0 ? totalScore / studentStats.length : 0;

      return {
        totalStudents: studentStats.length,
        averageScore: Math.round(averageScore),
        totalQuizzes: attempts?.length || 0,
        studentsAtRisk,
        allStudents: studentStats
      };
    },
    enabled: !!classes && classes.length > 0
  });

  if (loadingClasses || loadingStats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const classesAny = (classes || []) as any[];
  const selectedClass = classesAny.find((cls) => cls.id === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Dashboard da Turma</h2>
          <p className="text-muted-foreground">Acompanhe o desempenho dos seus alunos</p>
          {selectedClass && selectedClassId !== 'all' && selectedClass.invite_code && (
            <div className="mt-2 inline-flex flex-col gap-1 p-2 rounded-md border bg-muted/40">
              <span className="text-xs text-muted-foreground">Código da turma</span>
              <code className="text-lg font-semibold text-primary">{selectedClass.invite_code}</code>
            </div>
          )}
        </div>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione uma turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Turmas</SelectItem>
            {classesAny.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.averageScore || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Feitos</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.totalQuizzes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alunos em Risco</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {classStats?.studentsAtRisk?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students At Risk */}
      {classStats?.studentsAtRisk && classStats.studentsAtRisk.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Alunos que Precisam de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classStats.studentsAtRisk.slice(0, 10).map((student: any) => (
              <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{student.name}</h4>
                    <Badge variant="destructive" className="text-xs">
                      {student.recentActivity === 0 ? 'Inativo' : 'Baixo Desempenho'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>{student.quizzesCompleted} quizzes</span>
                    <span>Média: {Math.round(student.averageScore)}%</span>
                    <span>Atividade recente: {student.recentActivity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Progress value={student.averageScore} className="w-24 h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {classStats?.allStudents && classStats.allStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Melhores Desempenhos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classStats.allStudents
              .sort((a: any, b: any) => b.averageScore - a.averageScore)
              .slice(0, 5)
              .map((student: any, index: number) => (
                <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 text-center font-bold text-lg">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{student.quizzesCompleted} quizzes</span>
                        <Badge variant="secondary" className="capitalize">{student.rank}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(student.averageScore)}%
                    </div>
                    <div className="text-xs text-muted-foreground">{student.totalPoints} pts</div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
