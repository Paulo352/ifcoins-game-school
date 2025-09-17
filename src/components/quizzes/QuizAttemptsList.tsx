import React, { useState } from 'react';
import { useQuizAttempts, type Quiz } from '@/hooks/quizzes/useQuizSystemExtras';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  Trophy, 
  Calendar,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { QuizAttemptDetails } from './QuizAttemptDetails';

interface QuizAttemptsListProps {
  quiz: Quiz;
  onBack: () => void;
}

export function QuizAttemptsList({ quiz, onBack }: QuizAttemptsListProps) {
  console.log('🎯 [QuizAttemptsList] Renderizando lista para quiz:', quiz.id, quiz.title);
  
  const { data: attempts, isLoading } = useQuizAttempts(quiz.id);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  console.log('🎯 [QuizAttemptsList] Dados recebidos:', { attempts: attempts?.length || 0, isLoading });

  const selectedAttempt = attempts?.find(a => a.id === selectedAttemptId);

  if (selectedAttempt) {
    return (
      <QuizAttemptDetails
        attempt={selectedAttempt}
        onBack={() => setSelectedAttemptId(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h2 className="text-xl font-semibold">Tentativas - {quiz.title}</h2>
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
            {attempts.map((attempt) => {
              const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
              const passed = percentage >= 70;

              return (
                <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{attempt.profiles.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {attempt.profiles.email}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            <span>{attempt.score}/{attempt.total_questions} ({percentage}%)</span>
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
                          
                          {attempt.coins_earned > 0 && (
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