import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Trophy, Coins } from 'lucide-react';
import { useUserAttempts } from '@/hooks/quizzes/useQuizzes';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuizHistoryProps {
  onBack: () => void;
}

export function QuizHistory({ onBack }: QuizHistoryProps) {
  const { profile } = useAuth();
  const { data: attempts, isLoading } = useUserAttempts(profile?.id || null);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const completedAttempts = attempts?.filter(a => a.is_completed) || [];
  const totalCoinsEarned = completedAttempts.reduce((sum, a) => sum + (a.coins_earned || 0), 0);
  const averageScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => {
        const percentage = a.total_questions > 0 ? (a.correct_answers / a.total_questions) * 100 : 0;
        return sum + percentage;
      }, 0) / completedAttempts.length
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Quizzes</CardTitle>
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-sm">Quizzes Completados</span>
              </div>
              <p className="text-2xl font-bold">{completedAttempts.length}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Coins className="w-4 h-4" />
                <span className="text-sm">Moedas Ganhas</span>
              </div>
              <p className="text-2xl font-bold">{totalCoinsEarned}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-sm">Média de Acertos</span>
              </div>
              <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
            </div>
          </div>

          <div className="space-y-3">
            {completedAttempts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Você ainda não completou nenhum quiz.
              </p>
            ) : (
              completedAttempts.map((attempt) => {
                const percentage = attempt.total_questions > 0 
                  ? Math.round((attempt.correct_answers / attempt.total_questions) * 100)
                  : 0;
                
                return (
                  <Card key={attempt.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={percentage >= 70 ? 'default' : 'destructive'}
                              className="font-mono"
                            >
                              {attempt.correct_answers}/{attempt.total_questions} ({percentage}%)
                            </Badge>
                            {attempt.coins_earned > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <Coins className="w-3 h-3" />
                                +{attempt.coins_earned}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(attempt.completed_at || attempt.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                            {attempt.time_taken_seconds && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(attempt.time_taken_seconds)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                            {attempt.score}
                          </p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
