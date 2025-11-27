import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Coins, HelpCircle, Trophy, User } from 'lucide-react';
import { Quiz } from '@/hooks/quizzes/useQuizzes';

interface QuizCardProps {
  quiz: Quiz & { creator?: { name: string; role: string } };
  onStart?: (quizId: string) => void;
  userAttempts?: number;
  loading?: boolean;
  showManagement?: boolean;
  onToggleStatus?: (quizId: string, isActive: boolean) => void;
  onDelete?: (quizId: string) => void;
}

export function QuizCard({ 
  quiz, 
  onStart, 
  userAttempts = 0, 
  loading = false,
  showManagement = false,
  onToggleStatus,
  onDelete
}: QuizCardProps) {
  const canAttempt = !quiz.max_attempts || userAttempts < quiz.max_attempts;

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
          <Badge variant={quiz.is_active ? 'default' : 'secondary'}>
            {quiz.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        {quiz.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {quiz.description}
          </p>
        )}
        {quiz.creator && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <User className="w-3 h-3" />
            <span>
              {quiz.creator.role === 'admin' ? 'Sistema' : `Prof. ${quiz.creator.name}`}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">{quiz.reward_coins} moedas</span>
          </div>
          
          {quiz.time_limit_minutes && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{quiz.time_limit_minutes} min</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-500" />
            <span>
              {userAttempts}/{quiz.max_attempts || '∞'} tentativas
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-green-500" />
            <span>Quiz interativo</span>
          </div>
        </div>

        {!showManagement && onStart && (
          <Button
            onClick={() => onStart(quiz.id)}
            disabled={!canAttempt || loading || !quiz.is_active}
            className="w-full"
            variant={canAttempt && quiz.is_active ? 'default' : 'outline'}
          >
            {loading ? (
              'Carregando...'
            ) : !quiz.is_active ? (
              'Quiz Inativo'
            ) : !canAttempt ? (
              'Limite de tentativas atingido'
            ) : (
              'Iniciar Quiz'
            )}
          </Button>
        )}

        {showManagement && (
          <div className="flex gap-2">
            {onToggleStatus && (
              <Button
                onClick={() => onToggleStatus(quiz.id, !quiz.is_active)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {quiz.is_active ? 'Desativar' : 'Ativar'}
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(quiz.id)}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                Excluir
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}