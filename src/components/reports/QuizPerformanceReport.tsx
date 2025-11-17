import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Loader2, Users, Trophy, Clock, Target } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ifprLogo from '@/assets/ifpr-logo.png';
import { useClasses } from '@/hooks/useClasses';

export function QuizPerformanceReport() {
  const { profile } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const { data: classes } = useClasses();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['quiz-performance-report', selectedClassId],
    queryFn: async () => {
      let studentsQuery = supabase
        .from('profiles')
        .select('id, name, class')
        .eq('role', 'student');

      // Filtrar por turma se selecionada
      if (selectedClassId !== 'all') {
        const { data: classStudents } = await supabase
          .from('class_students')
          .select('student_id')
          .eq('class_id', selectedClassId);
        
        const studentIds = classStudents?.map(cs => cs.student_id) || [];
        if (studentIds.length === 0) return null;
        
        studentsQuery = studentsQuery.in('id', studentIds);
      }

      const { data: students, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;
      if (!students || students.length === 0) return null;

      const studentIds = students.map(s => s.id);

      // Buscar tentativas de quiz
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .in('user_id', studentIds)
        .eq('is_completed', true);

      if (attemptsError) throw attemptsError;

      // Calcular estatísticas
      const stats = {
        totalStudents: students.length,
        totalQuizzes: attempts?.length || 0,
        totalTimeSeconds: attempts?.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0) || 0,
        totalCorrect: attempts?.reduce((sum, a) => sum + a.correct_answers, 0) || 0,
        totalQuestions: attempts?.reduce((sum, a) => sum + a.total_questions, 0) || 0,
        students: students.map(student => {
          const studentAttempts = attempts?.filter(a => a.user_id === student.id) || [];
          const totalQuestions = studentAttempts.reduce((sum, a) => sum + a.total_questions, 0);
          const totalCorrect = studentAttempts.reduce((sum, a) => sum + a.correct_answers, 0);
          
          return {
            id: student.id,
            name: student.name,
            class: student.class,
            quizzesDone: studentAttempts.length,
            averageAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
            averageTime: studentAttempts.length > 0 
              ? studentAttempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0) / studentAttempts.length 
              : 0,
          };
        }).sort((a, b) => b.averageAccuracy - a.averageAccuracy),
      };

      return stats;
    },
  });

  const generatePDF = async () => {
    if (!reportData) {
      toast.error('Dados não disponíveis');
      return;
    }

    setGenerating(true);

    try {
      const doc = new jsPDF();
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');

      // Cabeçalho
      doc.addImage(ifprLogo, 'PNG', 15, 10, 30, 30);
      doc.setFontSize(18);
      doc.text('Relatório de Desempenho em Quizzes', 50, 20);
      doc.setFontSize(12);
      doc.text(`Data: ${dateStr}`, 50, 28);
      doc.text(`Professor: ${profile?.name}`, 50, 35);

      if (selectedClassId !== 'all') {
        const selectedClass = classes?.find(c => c.id === selectedClassId);
        if (selectedClass) {
          doc.text(`Turma: ${selectedClass.name}`, 50, 42);
        }
      }

      // Estatísticas Gerais
      doc.setFontSize(14);
      doc.text('Estatísticas Gerais', 20, selectedClassId !== 'all' ? 55 : 50);

      const averageAccuracy = reportData.totalQuestions > 0 
        ? ((reportData.totalCorrect / reportData.totalQuestions) * 100).toFixed(1)
        : '0.0';
      
      const averageTime = reportData.totalQuizzes > 0
        ? Math.round(reportData.totalTimeSeconds / reportData.totalQuizzes)
        : 0;

      const generalData = [
        ['Total de Alunos', reportData.totalStudents.toString()],
        ['Total de Quizzes Respondidos', reportData.totalQuizzes.toString()],
        ['Média de Acerto Geral', `${averageAccuracy}%`],
        ['Tempo Médio por Quiz', `${Math.floor(averageTime / 60)}m ${averageTime % 60}s`],
      ];

      autoTable(doc, {
        startY: selectedClassId !== 'all' ? 60 : 55,
        head: [['Métrica', 'Valor']],
        body: generalData,
        theme: 'grid',
      });

      // Desempenho por Aluno
      doc.setFontSize(14);
      const lastTableY = (doc as any).lastAutoTable.finalY || 100;
      doc.text('Desempenho por Aluno', 20, lastTableY + 10);

      const studentData = reportData.students.map(s => [
        s.name,
        s.quizzesDone.toString(),
        `${s.averageAccuracy.toFixed(1)}%`,
        `${Math.floor(s.averageTime / 60)}m ${Math.round(s.averageTime % 60)}s`,
      ]);

      autoTable(doc, {
        startY: lastTableY + 15,
        head: [['Aluno', 'Quizzes', 'Média Acerto', 'Tempo Médio']],
        body: studentData,
        theme: 'striped',
      });

      doc.save(`relatorio-quizzes-${dateStr}.pdf`);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Desempenho em Quizzes</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Não há quizzes respondidos{selectedClassId !== 'all' ? ' para esta turma' : ''} ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const averageAccuracy = reportData.totalQuestions > 0 
    ? ((reportData.totalCorrect / reportData.totalQuestions) * 100).toFixed(1)
    : '0.0';
  
  const averageTime = reportData.totalQuizzes > 0
    ? Math.round(reportData.totalTimeSeconds / reportData.totalQuizzes)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório de Desempenho em Quizzes</CardTitle>
              <CardDescription>Visualize o desempenho dos alunos em quizzes</CardDescription>
            </div>
            <Button onClick={generatePDF} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Filtrar por Turma</label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Turmas</SelectItem>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm">Alunos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-600" />
                  <CardTitle className="text-sm">Quizzes Feitos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalQuizzes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <CardTitle className="text-sm">Média de Acerto</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageAccuracy}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-sm">Tempo Médio</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.floor(averageTime / 60)}m {averageTime % 60}s
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Alunos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Desempenho por Aluno</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Posição</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Aluno</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Turma</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Quizzes</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Média Acerto</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Tempo Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportData.students.map((student, index) => (
                      <tr key={student.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                        </td>
                        <td className="px-4 py-3 text-sm">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {student.class || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">{student.quizzesDone}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`font-medium ${
                            student.averageAccuracy >= 70 ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {student.averageAccuracy.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {Math.floor(student.averageTime / 60)}m {Math.round(student.averageTime % 60)}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
