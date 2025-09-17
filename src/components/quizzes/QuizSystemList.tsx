import React from 'react';
import { useActiveQuizzes, type Quiz } from '@/hooks/quizzes/useQuizSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Clock, Coins, User } from 'lucide-react';

interface QuizSystemListProps {
  onStartQuiz: (quizId: string) => void;
}

export function QuizSystemList({ onStartQuiz }: QuizSystemListProps) {
  const { data: quizzes, isLoading, error } = useActiveQuizzes();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Erro ao carregar quizzes</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="text-center py-8">
        <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum quiz disponível</h3>
        <p className="text-muted-foreground">
          Não há quizzes ativos no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Quizzes Disponíveis</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz: Quiz) => (
          <Card key={quiz.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg leading-tight">
                  {quiz.title}
                </CardTitle>
                <Badge variant="secondary" className="ml-2 flex-shrink-0">
                  <Coins className="w-3 h-3 mr-1" />
                  {quiz.reward_coins}
                </Badge>
              </div>
              
              {quiz.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {quiz.description}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="w-4 h-4 mr-2" />
                  Criado por: {quiz.creator_role === 'admin' ? 'Sistema' : quiz.creator_name}
                </div>
                
                {quiz.time_limit_minutes && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    Tempo limite: {quiz.time_limit_minutes} minutos
                  </div>
                )}
                
                {quiz.max_attempts && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Tentativas: {quiz.max_attempts}
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => onStartQuiz(quiz.id)}
                className="w-full"
              >
                Iniciar Quiz
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}