import React from 'react';
import { useAttemptAnswers, type AnswerWithQuestion, type AttemptWithProfile } from '@/hooks/quizzes/useQuizSystemExtras';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  User, 
  Clock, 
  Trophy,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface QuizAttemptDetailsProps {
  attempt: AttemptWithProfile;
  onBack: () => void;
}

export function QuizAttemptDetails({ attempt, onBack }: QuizAttemptDetailsProps) {
  const { data: answers, isLoading, error } = useAttemptAnswers(attempt?.id || null);

  // Funções utilitárias com validação
  const calculatePercentage = (score: number, total: number): number => {
    if (!total || total <= 0) return 0;
    return Math.round((score / total) * 100);
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds || seconds <= 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const percentage = calculatePercentage(attempt?.score || 0, attempt?.total_questions || 1);
  const passed = percentage >= 70;

  // Estado de carregamento
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-8 h-8 text-destructive mb-2" />
          <p className="text-destructive text-center">
            Erro ao carregar detalhes da tentativa
          </p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h2 className="text-xl font-semibold">Detalhes da Tentativa</h2>
      </div>

      {/* Resumo da tentativa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {attempt?.profiles?.name || 'Usuário desconhecido'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p><strong>Email:</strong> {attempt?.profiles?.email || 'N/A'}</p>
              <p className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <strong>Pontuação:</strong> {attempt?.score || 0}/{attempt?.total_questions || 0} ({percentage}%)
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <strong>Tempo gasto:</strong> {formatDuration(attempt?.time_taken_seconds)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <strong>Iniciado:</strong> {formatDate(attempt?.started_at)}
              </p>
              {attempt?.completed_at && (
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <strong>Finalizado:</strong> {formatDate(attempt.completed_at)}
                </p>
              )}
              <div className="flex gap-2">
                <Badge variant={passed ? 'default' : 'destructive'}>
                  {passed ? 'Passou' : 'Reprovou'}
                </Badge>
                {(attempt?.coins_earned || 0) > 0 && (
                  <Badge variant="outline">
                    +{attempt.coins_earned} moedas
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Respostas detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Respostas Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          {!answers || answers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma resposta encontrada.
            </p>
          ) : (
            <div className="space-y-4">
              {answers.map((answer: AnswerWithQuestion, index) => (
                <div key={answer.id || index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {answer.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {index + 1}. {answer.quiz_questions?.question_text || 'Pergunta não encontrada'}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Resposta do aluno:</span>{' '}
                          <span className={answer.is_correct ? 'text-green-600' : 'text-red-600'}>
                            {answer.user_answer || 'N/A'}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Resposta correta:</span>{' '}
                          <span className="text-green-600">
                            {answer.quiz_questions?.correct_answer || 'N/A'}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Pontos: {answer.points_earned || 0}/{answer.quiz_questions?.points || 0}
                          </span>
                          {answer.answered_at && (
                            <span>• Respondido em: {formatDate(answer.answered_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}