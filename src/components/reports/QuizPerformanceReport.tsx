import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, TrendingUp, Award, Target } from 'lucide-react';
import { toast } from 'sonner';

export function QuizPerformanceReport() {
  const { profile } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Buscar todos os quizzes
  const { data: quizzes } = useQuery({
    queryKey: ['quizzes-for-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar dados de performance
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['quiz-performance', selectedQuiz, selectedClass],
    queryFn: async () => {
      let query = supabase
        .from('quiz_attempts')
        .select(`
          *,
          profiles!inner(name, email, class),
          quizzes!inner(title, reward_coins)
        `)
        .eq('is_completed', true);

      if (selectedQuiz !== 'all') {
        query = query.eq('quiz_id', selectedQuiz);
      }

      if (selectedClass !== 'all') {
        query = query.eq('profiles.class', selectedClass);
      }

      const { data, error } = await query.order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Processar dados para gráficos
  const chartData = React.useMemo(() => {
    if (!performanceData) return [];

    const studentStats = new Map<string, {
      name: string;
      totalAttempts: number;
      totalCorrect: number;
      totalQuestions: number;
      coinsEarned: number;
    }>();

    performanceData.forEach((attempt: any) => {
      const studentName = attempt.profiles?.name || 'Desconhecido';
      const existing = studentStats.get(studentName) || {
        name: studentName,
        totalAttempts: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        coinsEarned: 0
      };

      studentStats.set(studentName, {
        name: studentName,
        totalAttempts: existing.totalAttempts + 1,
        totalCorrect: existing.totalCorrect + (attempt.correct_answers || 0),
        totalQuestions: existing.totalQuestions + (attempt.total_questions || 0),
        coinsEarned: existing.coinsEarned + (attempt.coins_earned || 0)
      });
    });

    return Array.from(studentStats.values()).map(student => ({
      name: student.name,
      'Taxa de Acerto (%)': student.totalQuestions > 0 
        ? Math.round((student.totalCorrect / student.totalQuestions) * 100) 
        : 0,
      'Moedas Ganhas': student.coinsEarned,
      'Tentativas': student.totalAttempts
    }));
  }, [performanceData]);

  // Dados de evolução temporal
  const evolutionData = React.useMemo(() => {
    if (!performanceData) return [];

    const dateMap = new Map<string, { correct: number; total: number }>();

    performanceData.forEach((attempt: any) => {
      const date = new Date(attempt.completed_at).toLocaleDateString('pt-BR');
      const existing = dateMap.get(date) || { correct: 0, total: 0 };
      
      dateMap.set(date, {
        correct: existing.correct + (attempt.correct_answers || 0),
        total: existing.total + (attempt.total_questions || 0)
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, stats]) => ({
        data: date,
        'Taxa de Acerto (%)': stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      }))
      .slice(-10); // Últimos 10 dias
  }, [performanceData]);

  const exportToCSV = () => {
    if (!performanceData || performanceData.length === 0) {
      toast.error('Sem dados para exportar');
      return;
    }

    const csvData = performanceData.map((attempt: any) => ({
      'Aluno': attempt.profiles?.name || '',
      'Email': attempt.profiles?.email || '',
      'Turma': attempt.profiles?.class || '',
      'Quiz': attempt.quizzes?.title || '',
      'Acertos': attempt.correct_answers || 0,
      'Total': attempt.total_questions || 0,
      'Porcentagem': attempt.total_questions > 0 
        ? `${Math.round((attempt.correct_answers / attempt.total_questions) * 100)}%` 
        : '0%',
      'Moedas': attempt.coins_earned || 0,
      'Data': new Date(attempt.completed_at).toLocaleString('pt-BR')
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-quizzes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Relatório exportado com sucesso!');
  };

  if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Acesso restrito a professores e administradores</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatório de Performance em Quizzes</h2>
          <p className="text-muted-foreground">Análise detalhada do desempenho dos alunos</p>
        </div>
        <Button onClick={exportToCSV} disabled={!performanceData || performanceData.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz</label>
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os quizzes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os quizzes</SelectItem>
                  {quizzes?.map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Turma</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  <SelectItem value="1A">1A</SelectItem>
                  <SelectItem value="1B">1B</SelectItem>
                  <SelectItem value="2A">2A</SelectItem>
                  <SelectItem value="2B">2B</SelectItem>
                  <SelectItem value="3A">3A</SelectItem>
                  <SelectItem value="3B">3B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tentativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média de Acerto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData && performanceData.length > 0
                ? Math.round(
                    (performanceData.reduce((acc: number, curr: any) => 
                      acc + (curr.correct_answers / curr.total_questions), 0
                    ) / performanceData.length) * 100
                  )
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moedas Distribuídas</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData?.reduce((acc: number, curr: any) => acc + (curr.coins_earned || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Performance por Aluno */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Aluno</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Taxa de Acerto (%)" fill="hsl(var(--primary))" />
                <Bar dataKey="Moedas Ganhas" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Temporal</CardTitle>
        </CardHeader>
        <CardContent>
          {evolutionData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Taxa de Acerto (%)" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
