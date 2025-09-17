import React, { useState } from 'react';
import { useQuizAttempts, type Quiz, type AttemptWithProfile } from '@/hooks/quizzes/useQuizSystemExtras';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  Trophy, 
  Calendar,
  Eye,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { QuizAttemptDetails } from './QuizAttemptDetails';

interface QuizAttemptsListProps {
  quiz: Quiz;
  onBack: () => void;
}

export function QuizAttemptsList({ quiz, onBack }: QuizAttemptsListProps) {
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  
  const { data: attempts, isLoading, error } = useQuizAttempts(quiz?.id || null);

  console.log('🎯 [QuizAttemptsList] Estado:', { 
    quizId: quiz?.id, 
    quizTitle: quiz?.title,
    attempts: attempts?.length || 0, 
    isLoading,
    error 
  });

  // Encontrar tentativa selecionada de forma segura
  const selectedAttempt = attempts?.find((a: AttemptWithProfile) => a.id === selectedAttemptId);

  // Se há uma tentativa selecionada, mostrar detalhes
  if (selectedAttempt) {
    return (
      <QuizAttemptDetails
        attempt={selectedAttempt}
        onBack={() => setSelectedAttemptId(null)}
      />
    );
  }

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
            Erro ao carregar tentativas do quiz
          </p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Funções utilitárias
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

  const calculatePercentage = (score: number, total: number): number => {
    if (!total || total <= 0) return 0;
    return Math.round((score / total) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h2 className="text-xl font-semibold">Tentativas - {quiz?.title || 'Quiz'}</h2>
      </div>

      {!attempts || attempts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma tentativa encontrada para este quiz.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {attempts.map((attempt: AttemptWithProfile) => {
              const percentage = calculatePercentage(attempt.score || 0, attempt.total_questions || 1);
              const passed = percentage >= 70;

              return (
                <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {attempt.profiles?.name || 'Usuário desconhecido'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {attempt.profiles?.email || 'N/A'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            <span>
                              {attempt.score || 0}/{attempt.total_questions || 0} ({percentage}%)
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(attempt.time_taken_seconds)}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(attempt.started_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={passed ? 'default' : 'destructive'}>
                            {passed ? 'Passou' : 'Reprovou'}
                          </Badge>
                          
                          {(attempt.coins_earned || 0) > 0 && (
                            <Badge variant="outline">
                              +{attempt.coins_earned} moedas
                            </Badge>
                          )}

                          <Badge variant={attempt.is_completed ? 'default' : 'secondary'}>
                            {attempt.is_completed ? 'Completo' : 'Em andamento'}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAttemptId(attempt.id)}
                        disabled={!attempt.is_completed}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}