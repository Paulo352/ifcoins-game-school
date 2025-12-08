import React from 'react';
import { useActiveQuizzes, useUserAttempts, type Quiz } from '@/hooks/quizzes/useQuizzes';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Clock, Coins, User, History, Award, BarChart3, GraduationCap } from 'lucide-react';

interface QuizSystemListProps {
  onStartQuiz: (quizId: string, practiceMode?: boolean) => void;
  onViewChange: (view: 'history' | 'badges' | 'ranking') => void;
}

export function QuizSystemList({ onStartQuiz, onViewChange }: QuizSystemListProps) {
  const { data: quizzes, isLoading, error } = useActiveQuizzes();
  const { profile } = useAuth();
  const { data: userAttempts } = useUserAttempts(profile?.id || null);

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quizzes Disponíveis</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChange('history')}
          >
            <History className="w-4 h-4 mr-2" />
            Histórico
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChange('badges')}
          >
            <Award className="w-4 h-4 mr-2" />
            Conquistas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChange('ranking')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Ranking
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{quizzes.map((quiz: Quiz & { creator?: { name: string; role: string } | null }) => {
          // Determinar o texto do criador
          const getCreatorText = () => {
            if (!quiz.creator) return 'Sistema';
            if (quiz.creator.role === 'admin') return 'Sistema';
            return `Prof. ${quiz.creator.name}`;
          };
          
          return (
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
                  Criado por: {getCreatorText()}
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
              
              <div className="space-y-2">
                {(() => {
                  const hasCompleted = userAttempts?.some(
                    (attempt: any) => attempt.quiz_id === quiz.id && attempt.is_completed && !attempt.practice_mode
                  );
                  
                  return (
                    <>
                      <Button 
                        onClick={() => onStartQuiz(quiz.id, false)}
                        className="w-full"
                        disabled={hasCompleted}
                      >
                        {hasCompleted ? '✓ Completado' : 'Iniciar Quiz'}
                      </Button>
                      {hasCompleted && (
                        <Button
                          onClick={() => onStartQuiz(quiz.id, true)}
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <GraduationCap className="w-4 h-4" />
                          Modo Prática
                        </Button>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}