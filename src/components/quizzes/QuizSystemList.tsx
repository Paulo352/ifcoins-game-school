import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveQuizzes, useUserAttempts } from '@/hooks/quizzes/useQuizSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Clock, Coins, Users } from 'lucide-react';

interface QuizSystemListProps {
  onStartQuiz: (quizId: string) => void;
}

export function QuizSystemList({ onStartQuiz }: QuizSystemListProps) {
  const { profile, user, loading: authLoading } = useAuth();
  const { data: quizzes, isLoading: quizzesLoading } = useActiveQuizzes();
  const { data: userAttempts } = useUserAttempts(profile?.id || null);

  console.log('🎯 QuizSystemList - Estado:', {
    profile: !!profile,
    user: !!user,
    authLoading,
    quizzesLoading,
    quizzesCount: quizzes?.length || 0,
    attemptsCount: userAttempts?.length || 0
  });

  if (authLoading || quizzesLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Login Necessário</h3>
          <p className="text-muted-foreground">
            Você precisa estar logado para acessar os quizzes.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum Quiz Disponível</h3>
          <p className="text-muted-foreground">
            Não há quizzes ativos no momento. Volte mais tarde!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Contar tentativas por quiz
  const attemptsByQuiz = userAttempts?.reduce((acc, attempt) => {
    acc[attempt.quiz_id] = (acc[attempt.quiz_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleQuizStart = (quizId: string) => {
    console.log('🎯 Iniciando quiz:', quizId);
    onStartQuiz(quizId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Quizzes Disponíveis</h2>
        <p className="text-muted-foreground">
          Responda quizzes e ganhe moedas! Você precisa de pelo menos 70% de acertos para ganhar a recompensa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const userAttemptCount = attemptsByQuiz[quiz.id] || 0;
          const canTakeQuiz = !quiz.max_attempts || userAttemptCount < quiz.max_attempts;

          return (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    <Coins className="w-3 h-3 mr-1" />
                    {quiz.reward_coins}
                  </Badge>
                </div>
                {quiz.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {quiz.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  {quiz.time_limit_minutes && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      Tempo limite: {quiz.time_limit_minutes} minutos
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    Tentativas: {userAttemptCount}
                    {quiz.max_attempts && ` / ${quiz.max_attempts}`}
                  </div>
                </div>

                <Button
                  onClick={() => handleQuizStart(quiz.id)}
                  disabled={!canTakeQuiz}
                  className="w-full"
                >
                  {canTakeQuiz ? 'Iniciar Quiz' : 'Limite de tentativas atingido'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}