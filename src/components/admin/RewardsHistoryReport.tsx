import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, Calendar, Coins } from 'lucide-react';
import ifprLogo from '@/assets/ifpr-logo.png';

interface RewardLogData {
  id: string;
  coins: number;
  reason: string;
  created_at: string;
  student: { name: string };
  teacher: { name: string };
}

export function RewardsHistoryReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const generateRewardsHistoryPDF = async () => {
    if (!profile || profile.role !== 'admin') return;
    
    setLoading(true);
    try {
      // Buscar todos os registros de recompensas
      const { data: rewardLogs, error } = await supabase
        .from('reward_logs')
        .select(`
          id,
          coins,
          reason,
          created_at,
          student:profiles!reward_logs_student_id_fkey(name),
          teacher:profiles!reward_logs_teacher_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!rewardLogs || rewardLogs.length === 0) {
        toast.error('Nenhum histórico de moedas encontrado');
        return;
      }

      // Criar PDF
      const doc = new jsPDF();
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR');
      
      // Logo IFPR
      doc.addImage(ifprLogo, 'PNG', 15, 10, 30, 30);
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.text('IFPR Cards - Histórico Completo de Moedas', 50, 25);
      doc.setFontSize(12);
      doc.text(`Relatório gerado em: ${dateStr} às ${timeStr}`, 50, 35);
      
      // Estatísticas resumidas
      const totalCoinsGiven = rewardLogs.reduce((sum, log) => sum + log.coins, 0);
      const totalTransactions = rewardLogs.length;
      const uniqueStudents = new Set(rewardLogs.map(log => log.student.name)).size;
      const uniqueTeachers = new Set(rewardLogs.map(log => log.teacher.name)).size;

      // Análise de distribuição por professor
      const teacherStats = rewardLogs.reduce((acc, log) => {
        const teacherName = log.teacher.name;
        const studentName = log.student.name;
        
        if (!acc[teacherName]) {
          acc[teacherName] = {
            totalCoins: 0,
            totalTransactions: 0,
            students: new Set(),
            studentCoins: {}
          };
        }
        
        acc[teacherName].totalCoins += log.coins;
        acc[teacherName].totalTransactions += 1;
        acc[teacherName].students.add(studentName);
        
        if (!acc[teacherName].studentCoins[studentName]) {
          acc[teacherName].studentCoins[studentName] = 0;
        }
        acc[teacherName].studentCoins[studentName] += log.coins;
        
        return acc;
      }, {} as Record<string, any>);

      // Identificar padrões suspeitos
      const suspiciousTeachers = Object.entries(teacherStats).filter(([_, stats]) => {
        const studentsCount = stats.students.size;
        const avgCoinsPerStudent = stats.totalCoins / studentsCount;
        const studentCoinsList = Object.values(stats.studentCoins);
        const maxCoinsToStudent = Math.max(...studentCoinsList as number[]);
        
        // Suspeito se: mais de 70% das moedas para menos de 30% dos alunos
        return studentsCount > 1 && (maxCoinsToStudent / stats.totalCoins) > 0.7;
      });

      doc.setFontSize(14);
      doc.text('Resumo Estatístico:', 20, 50);
      doc.setFontSize(10);
      doc.text(`Total de moedas distribuídas: ${totalCoinsGiven.toLocaleString('pt-BR')} IFCoins`, 25, 60);
      doc.text(`Total de transações: ${totalTransactions.toLocaleString('pt-BR')}`, 25, 67);
      doc.text(`Estudantes beneficiados: ${uniqueStudents.toLocaleString('pt-BR')}`, 25, 74);
      doc.text(`Professores participantes: ${uniqueTeachers.toLocaleString('pt-BR')}`, 25, 81);

      // Análise de distribuição por professor
      let currentY = 95;
      doc.setFontSize(14);
      doc.text('Análise de Distribuição por Professor:', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      Object.entries(teacherStats).forEach(([teacherName, stats]) => {
        const studentsCount = stats.students.size;
        const avgCoinsPerStudent = Math.round(stats.totalCoins / studentsCount);
        
        // Top 3 alunos que mais receberam moedas deste professor
        const topStudents = Object.entries(stats.studentCoins)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3);
        
        doc.text(`${teacherName}:`, 25, currentY);
        doc.text(`  • ${stats.totalCoins} moedas para ${studentsCount} alunos (média: ${avgCoinsPerStudent} por aluno)`, 30, currentY + 7);
        doc.text(`  • Top alunos: ${topStudents.map(([name, coins]) => `${name} (${coins})`).join(', ')}`, 30, currentY + 14);
        
        // Indicar se é suspeito
        const isSuspicious = suspiciousTeachers.some(([name]) => name === teacherName);
        if (isSuspicious) {
          doc.setTextColor(255, 0, 0);
          doc.text(`  ⚠️ ATENÇÃO: Concentração alta de moedas em poucos alunos`, 30, currentY + 21);
          doc.setTextColor(0, 0, 0);
          currentY += 28;
        } else {
          currentY += 21;
        }
        currentY += 5;
      });

      // Preparar dados para a tabela
      const tableData = rewardLogs.map(log => [
        new Date(log.created_at).toLocaleDateString('pt-BR'),
        new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        log.student.name,
        log.teacher.name,
        `${log.coins > 0 ? '+' : ''}${log.coins}`,
        log.reason.length > 40 ? `${log.reason.substring(0, 40)}...` : log.reason
      ]);

      // Adicionar tabela
      autoTable(doc, {
        startY: currentY + 10,
        head: [['Data', 'Hora', 'Estudante', 'Professor', 'Moedas', 'Motivo']],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Data
          1: { cellWidth: 15 }, // Hora
          2: { cellWidth: 35 }, // Estudante
          3: { cellWidth: 35 }, // Professor
          4: { cellWidth: 15, halign: 'center' }, // Moedas
          5: { cellWidth: 70 } // Motivo
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        theme: 'striped',
        margin: { left: 10, right: 10 }
      });

      // Adicionar rodapé com informações adicionais
      const finalY = (doc as any).lastAutoTable.finalY || currentY + 10;
      doc.setFontSize(8);
      doc.text('Observações:', 20, finalY + 20);
      doc.text('• Valores positivos (+) representam moedas dadas aos estudantes', 25, finalY + 27);
      doc.text('• Valores negativos (-) representam moedas retiradas dos estudantes', 25, finalY + 34);
      doc.text('• Este relatório contém todos os registros históricos do sistema', 25, finalY + 41);
      doc.text('• ⚠️ Professores marcados podem ter distribuição concentrada em poucos alunos', 25, finalY + 48);

      // Salvar PDF
      const fileName = `IFPR_Cards_Historico_Moedas_${dateStr.replace(/\//g, '-')}_${timeStr.replace(/:/g, '-')}.pdf`;
      doc.save(fileName);

      toast.success('Relatório de histórico de moedas gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório de histórico:', error);
      toast.error('Erro ao gerar relatório de histórico');
    } finally {
      setLoading(false);
    }
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Análise de Distribuição de Moedas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Gere um relatório completo em PDF com todo o histórico de moedas distribuídas no sistema, 
            incluindo análise de padrões suspeitos, distribuição por professor e informações detalhadas sobre favoristismo.
          </p>
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Relatório Completo com Análise</p>
              <p className="text-xs text-blue-700">
                Inclui detecção automática de padrões suspeitos e concentração de recompensas
              </p>
            </div>
          </div>

          <Button 
            onClick={generateRewardsHistoryPDF}
            disabled={loading}
            className="w-full flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Gerando Relatório...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Baixar Relatório de Análise de Moedas (PDF)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}