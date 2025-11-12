import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ifprLogo from '@/assets/ifpr-logo.png';

interface QuizPerformanceReportProps {
  studentId?: string;
}

export function QuizPerformanceReport({ studentId }: QuizPerformanceReportProps) {
  const { profile } = useAuth();
  const [generating, setGenerating] = useState(false);
  const targetStudentId = studentId || profile?.id;

  const { data: studentData } = useQuery({
    queryKey: ['student-report-data', targetStudentId],
    queryFn: async () => {
      if (!targetStudentId) return null;

      const { data: student, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetStudentId)
        .single();

      if (studentError) throw studentError;

      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(title)
        `)
        .eq('user_id', targetStudentId)
        .order('started_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      const { data: badges, error: badgesError } = await supabase
        .from('user_badge_progress')
        .select('*')
        .eq('user_id', targetStudentId);

      if (badgesError && badgesError.code !== 'PGRST116') throw badgesError;

      const { data: rank, error: rankError } = await supabase
        .from('user_ranks')
        .select('*')
        .eq('user_id', targetStudentId)
        .maybeSingle();

      if (rankError && rankError.code !== 'PGRST116') throw rankError;

      const { data: matches, error: matchesError } = await supabase
        .from('multiplayer_match_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (matchesError) throw matchesError;

      return {
        student,
        attempts: attempts || [],
        badges: badges || [],
        rank,
        matches: matches || [],
      };
    },
    enabled: !!targetStudentId,
  });

  const generatePDF = async () => {
    if (!studentData) {
      toast.error('Dados não disponíveis');
      return;
    }

    setGenerating(true);

    try {
      const { student, attempts, badges, rank, matches } = studentData;
      const doc = new jsPDF();
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');

      doc.addImage(ifprLogo, 'PNG', 15, 10, 30, 30);
      doc.setFontSize(18);
      doc.text('Relatório de Desempenho do Aluno', 50, 20);
      doc.setFontSize(12);
      doc.text(`Data: ${dateStr}`, 50, 28);
      doc.text(`Aluno: ${student.name}`, 50, 35);

      doc.setFontSize(14);
      doc.text('Informações Gerais', 20, 50);
      
      const generalData = [
        ['Nome', student.name],
        ['Email', student.email],
        ['Turma', student.class || 'N/A'],
        ['RA', student.ra || 'N/A'],
        ['IFCoins', student.coins.toString()],
        ['Rank', rank?.current_rank || 'Iniciante'],
        ['Pontos', rank?.total_points?.toString() || '0'],
      ];

      autoTable(doc, {
        startY: 55,
        head: [['Campo', 'Valor']],
        body: generalData,
        theme: 'grid',
      });

      const completedAttempts = attempts.filter(a => a.is_completed);
      if (completedAttempts.length > 0) {
        doc.setFontSize(14);
        doc.text('Desempenho em Quizzes', 20, (doc as any).lastAutoTable.finalY + 15);

        const avgScore = completedAttempts.reduce((acc, a) => acc + (a.score / a.total_questions), 0) / completedAttempts.length;
        const totalCoins = completedAttempts.reduce((acc, a) => acc + a.coins_earned, 0);

        const quizStats = [
          ['Total de Quizzes Realizados', completedAttempts.length.toString()],
          ['Taxa Média de Acerto', `${(avgScore * 100).toFixed(1)}%`],
          ['Total de Moedas Ganhas', totalCoins.toString()],
          ['Melhor Desempenho', `${Math.max(...completedAttempts.map(a => (a.score / a.total_questions) * 100)).toFixed(1)}%`],
        ];

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Métrica', 'Valor']],
          body: quizStats,
          theme: 'grid',
        });

        doc.setFontSize(14);
        doc.text('Últimas Tentativas (Top 10)', 20, (doc as any).lastAutoTable.finalY + 15);

        const attemptsData = completedAttempts.slice(0, 10).map(a => [
          a.quiz?.title || 'Quiz',
          `${a.correct_answers}/${a.total_questions}`,
          `${((a.score / a.total_questions) * 100).toFixed(1)}%`,
          new Date(a.started_at).toLocaleDateString('pt-BR'),
        ]);

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Quiz', 'Acertos', 'Taxa', 'Data']],
          body: attemptsData,
          theme: 'grid',
        });
      }

      if (badges.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Progresso de Badges', 20, 20);

        const badgesData = badges.map(b => [
          'Badge',
          b.current_level || 'bronze',
          b.current_progress.toString(),
          new Date(b.created_at).toLocaleDateString('pt-BR'),
        ]);

        autoTable(doc, {
          startY: 25,
          head: [['Nome', 'Nível', 'Progresso', 'Data']],
          body: badgesData,
          theme: 'grid',
        });
      }

      const fileName = `Relatorio_${student.name.replace(/\s/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5" />
          Relatório de Desempenho
        </CardTitle>
        <CardDescription>
          Exportar relatório completo com estatísticas de desempenho
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={generatePDF} 
          disabled={generating || !studentData}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Relatório PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
