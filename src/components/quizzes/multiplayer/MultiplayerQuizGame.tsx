import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRoom, useRoomPlayers, useUpdatePlayerPosition } from '@/hooks/quizzes/useMultiplayerQuiz';
import { useQuizQuestions, useStartQuizAttempt, useValidateAnswer } from '@/hooks/quizzes/useQuizzes';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Clock, Target } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MultiplayerQuizGameProps {
  roomId: string;
  onFinish: () => void;
}

export function MultiplayerQuizGame({ roomId, onFinish }: MultiplayerQuizGameProps) {
  const { profile, user } = useAuth();
  const { data: room } = useRoom(roomId);
  const { players } = useRoomPlayers(roomId);
  const { data: questions } = useQuizQuestions(room?.quiz_id || '');
  const startAttemptMutation = useStartQuizAttempt();
  const validateAnswerMutation = useValidateAnswer();
  const updatePositionMutation = useUpdatePlayerPosition();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions?.[currentQuestionIndex];
  const totalQuestions = questions?.length || 0;
  const progress = (currentQuestionIndex / totalQuestions) * 100;

  // Iniciar attempt ao começar o jogo
  useEffect(() => {
    if (room?.quiz_id && user && !attemptId) {
      startAttemptMutation.mutate(
        { quizId: room.quiz_id, userId: user.id, practiceMode: false },
        {
          onSuccess: (data) => {
            setAttemptId(data.attempt_id);
          }
        }
      );
    }
  }, [room?.quiz_id, user, attemptId]);

  const handleAnswerSubmit = async () => {
    if (!attemptId || !currentQuestion || !selectedAnswer || !user) return;

    try {
      const result = await validateAnswerMutation.mutateAsync({
        attemptId,
        questionId: currentQuestion.id,
        userAnswer: selectedAnswer,
        userId: user.id
      });

      if (result.is_correct) {
        setScore((prev) => prev + result.points_earned);
      }

      // Avançar para próxima pergunta ou finalizar
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer('');
      } else {
        // Finalizar quiz e atualizar posição
        setIsFinished(true);
        
        // Encontrar posição do jogador
        const currentPlayer = players.find(p => p.user_id === user.id);
        if (currentPlayer) {
          const finishedPlayers = players.filter(p => p.position !== null).length;
          updatePositionMutation.mutate({
            playerId: currentPlayer.id,
            position: finishedPlayers + 1,
            attemptId
          });
        }
      }
    } catch (error) {
      console.error('Erro ao validar resposta:', error);
    }
  };

  if (!currentQuestion && !isFinished) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isFinished) {
    // Ordenar players por posição
    const sortedPlayers = [...players]
      .filter(p => p.position !== null)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Quiz Finalizado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">{score}</p>
              <p className="text-muted-foreground">Pontos</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Classificação Final</h3>
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    player.user_id === user?.id ? 'bg-primary/10' : 'bg-muted/50'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/20 font-bold">
                    {index + 1}
                  </div>
                  <Avatar>
                    <AvatarFallback>
                      {player.profiles?.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{player.profiles?.name}</p>
                  </div>
                  {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                  {index === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                  {index === 2 && <Trophy className="w-5 h-5 text-orange-600" />}
                </div>
              ))}
            </div>

            <Button onClick={onFinish} className="w-full">
              Voltar ao Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header com placar e progresso */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{score}</p>
                <p className="text-xs text-muted-foreground">Pontos</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{currentQuestionIndex + 1}/{totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Questões</p>
              </div>
            </div>
            <div className="flex gap-2">
              {players
                .filter(p => p.position !== null)
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .slice(0, 3)
                .map((player, index) => (
                  <div key={player.id} className="flex items-center gap-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {player.profiles?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">#{index + 1}</span>
                  </div>
                ))}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Pergunta */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Questão {currentQuestionIndex + 1}</Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>{currentQuestion.points} pontos</span>
            </div>
          </div>
          <CardTitle className="text-xl mt-4">{currentQuestion.question_text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options &&
            (currentQuestion.options as string[]).map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === option ? 'default' : 'outline'}
                className="w-full justify-start h-auto py-4 text-left"
                onClick={() => setSelectedAnswer(option)}
              >
                <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                <span>{option}</span>
              </Button>
            ))}

          <Button
            onClick={handleAnswerSubmit}
            disabled={!selectedAnswer || validateAnswerMutation.isPending}
            className="w-full mt-4"
            size="lg"
          >
            {validateAnswerMutation.isPending ? 'Validando...' : 'Responder'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
