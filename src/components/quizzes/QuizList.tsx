import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveQuizzes, useUserAttempts } from '@/hooks/quizzes/useQuizzes';
import { QuizCard } from './QuizCard';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

interface QuizListProps {
  onStartQuiz: (quizId: string) => void;
}

export function QuizList({ onStartQuiz }: QuizListProps) {
  const { profile, user, loading: authLoading } = useAuth();
  const { data: quizzes, isLoading } = useActiveQuizzes();
  const { data: userAttempts } = useUserAttempts(profile?.id);

  console.log('QuizList - Profile:', profile, 'User:', user, 'Auth Loading:', authLoading);

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
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
          <h3 className="text-lg font-medium mb-2">Nenhum quiz disponível</h3>
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Quizzes Disponíveis</h2>
        <p className="text-muted-foreground">
          Responda quizzes e ganhe moedas! Você precisa de pelo menos 70% de acertos para ganhar a recompensa.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onStart={onStartQuiz}
            userAttempts={attemptsByQuiz[quiz.id] || 0}
          />
        ))}
      </div>
    </div>
  );
}