import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRoom, useRoomPlayers, useNextQuestion, useFinishRoom, useDistributeRewards } from '@/hooks/quizzes/useMultiplayerQuiz';
import { useQuizQuestions } from '@/hooks/quizzes/useQuizzes';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Clock, Target, Users, ChevronRight, Award, Gift, Coins } from 'lucide-react';
import { toast } from 'sonner';

interface TeacherQuizControlProps {
  roomId: string;
  onFinish: () => void;
}

export function TeacherQuizControl({ roomId, onFinish }: TeacherQuizControlProps) {
  const { user } = useAuth();
  const { data: room } = useRoom(roomId);
  const { players } = useRoomPlayers(roomId);
  const { data: questions } = useQuizQuestions(room?.quiz_id || '');
  const nextQuestionMutation = useNextQuestion();
  const finishRoomMutation = useFinishRoom();
  const distributeRewardsMutation = useDistributeRewards();

  const [timeLeft, setTimeLeft] = useState(0);
  const [isAutoAdvance, setIsAutoAdvance] = useState(true);

  const currentQuestionIndex = room?.current_question_index || 0;
  const currentQuestion = questions?.[currentQuestionIndex];
  const totalQuestions = questions?.length || 0;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const isFinished = room?.status === 'finished';

  // Timer countdown
  useEffect(() => {
    if (!room?.question_started_at || isFinished) return;

    const questionStartTime = new Date(room.question_started_at).getTime();
    const timeLimit = (room.time_per_question_seconds || 30) * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - questionStartTime;
      const remaining = Math.max(0, Math.ceil((timeLimit - elapsed) / 1000));
      setTimeLeft(remaining);

      // Auto advance when time is up
      if (remaining === 0 && isAutoAdvance && !isLastQuestion) {
        handleNextQuestion();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [room?.question_started_at, room?.time_per_question_seconds, isFinished, currentQuestionIndex]);

  const handleNextQuestion = useCallback(() => {
    if (isLastQuestion) {
      handleFinishQuiz();
    } else {
      nextQuestionMutation.mutate({
        roomId,
        questionIndex: currentQuestionIndex + 1
      });
    }
  }, [roomId, currentQuestionIndex, isLastQuestion]);

  const handleFinishQuiz = async () => {
    await finishRoomMutation.mutateAsync(roomId);
  };

  const handleDistributeRewards = async () => {
    try {
      await distributeRewardsMutation.mutateAsync({ roomId });
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Finished state - show results
  if (isFinished || room?.status === 'finished') {
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
            {/* Reward info */}
            {room?.reward_type !== 'none' && (
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                {room?.reward_type === 'coins' && (
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span>Prêmios: 1º {room.reward_coins_1st} | 2º {room.reward_coins_2nd} | 3º {room.reward_coins_3rd} moedas</span>
                  </div>
                )}
                {room?.reward_type === 'card' && (
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5 text-purple-500" />
                    <span>Carta exclusiva para o 1º lugar</span>
                  </div>
                )}
                {room?.reward_type === 'external' && (
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5 text-green-500" />
                    <span>{room.reward_external_description}</span>
                  </div>
                )}
              </div>
            )}

            {/* Final ranking */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Classificação Final ({sortedPlayers.length} jogadores)
              </h3>
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-4 rounded-lg ${
                    index < 3 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ${
                    index === 0 ? 'bg-yellow-500 text-yellow-950' :
                    index === 1 ? 'bg-gray-300 text-gray-800' :
                    index === 2 ? 'bg-orange-400 text-orange-950' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar>
                    <AvatarFallback>
                      {player.profiles?.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{player.profiles?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {player.correct_answers} acertos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{player.score}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                  {index === 0 && <Trophy className="w-6 h-6 text-yellow-500" />}
                  {index === 1 && <Award className="w-6 h-6 text-gray-400" />}
                  {index === 2 && <Award className="w-6 h-6 text-orange-500" />}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {room?.reward_type !== 'none' && !room?.rewards_distributed && (
                <Button
                  onClick={handleDistributeRewards}
                  disabled={distributeRewardsMutation.isPending}
                  className="flex-1"
                  size="lg"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {distributeRewardsMutation.isPending ? 'Distribuindo...' : 'Distribuir Prêmios'}
                </Button>
              )}
              {room?.rewards_distributed && (
                <Badge variant="secondary" className="flex-1 justify-center py-3">
                  ✓ Prêmios já distribuídos
                </Badge>
              )}
              <Button onClick={onFinish} variant="outline" className="flex-1">
                Voltar ao Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content - Question display */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header with timer and progress */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{currentQuestionIndex + 1}/{totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">Questão</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className={`text-center ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : ''}`}>
                  <Clock className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{timeLeft}s</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAutoAdvance(!isAutoAdvance)}
                >
                  Auto: {isAutoAdvance ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Current Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-lg px-4 py-1">
                Questão {currentQuestionIndex + 1}
              </Badge>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4" />
                <span>{currentQuestion?.points || 10} pontos</span>
              </div>
            </div>
            <CardTitle className="text-2xl mt-4">{currentQuestion?.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion?.options &&
              (currentQuestion.options as string[]).map((option, index) => (
                <div
                  key={index}
                  className="w-full p-4 rounded-lg border-2 bg-muted/50 text-left"
                >
                  <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </div>
              ))}

            <div className="pt-4 flex gap-3">
              <Button
                onClick={handleNextQuestion}
                disabled={nextQuestionMutation.isPending}
                className="flex-1"
                size="lg"
              >
                {isLastQuestion ? (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    Finalizar Quiz
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Próxima Questão
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Resposta correta: <strong>{(currentQuestion as any)?.correct_answer}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Live leaderboard */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Placar ao Vivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    index < 3 ? 'bg-primary/10' : 'bg-muted/50'
                  }`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-yellow-950' :
                    index === 1 ? 'bg-gray-300 text-gray-800' :
                    index === 2 ? 'bg-orange-400 text-orange-950' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {player.profiles?.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-sm font-medium">
                    {player.profiles?.name}
                  </span>
                  <span className="font-bold">{player.score}</span>
                </div>
              ))}

              {players.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum jogador ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{players.length}</p>
                <p className="text-xs text-muted-foreground">Jogadores</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter(p => p.current_question_index >= currentQuestionIndex).length}
                </p>
                <p className="text-xs text-muted-foreground">Responderam</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}