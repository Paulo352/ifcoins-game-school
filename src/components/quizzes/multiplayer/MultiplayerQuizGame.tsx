import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRoom, useRoomPlayers, useUpdatePlayerScore } from '@/hooks/quizzes/useMultiplayerQuiz';
import { useQuizQuestions } from '@/hooks/quizzes/useQuizzes';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Clock, Target, Users } from 'lucide-react';
import { toast } from 'sonner';

interface MultiplayerQuizGameProps {
  roomId: string;
  onFinish: () => void;
}

export function MultiplayerQuizGame({ roomId, onFinish }: MultiplayerQuizGameProps) {
  const { user } = useAuth();
  const { data: room } = useRoom(roomId);
  const { players } = useRoomPlayers(roomId);
  const { data: questions } = useQuizQuestions(room?.quiz_id || '');
  const updateScoreMutation = useUpdatePlayerScore();

  const [myScore, setMyScore] = useState(0);
  const [myCorrectAnswers, setMyCorrectAnswers] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastAnswerResult, setLastAnswerResult] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const currentQuestionIndex = room?.current_question_index || 0;
  const currentQuestion = questions?.[currentQuestionIndex];
  const totalQuestions = questions?.length || 0;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isFinished = room?.status === 'finished';

  // Find my player record
  const myPlayer = players.find(p => p.user_id === user?.id);

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
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [room?.question_started_at, room?.time_per_question_seconds, isFinished]);

  // Reset answer state when question changes
  useEffect(() => {
    setSelectedAnswer('');
    setHasAnswered(false);
    setLastAnswerResult(null);
  }, [currentQuestionIndex]);

  const handleAnswerSubmit = useCallback(async () => {
    if (!currentQuestion || !selectedAnswer || hasAnswered || !myPlayer) return;

    setHasAnswered(true);

    // Check if answer is correct
    const correctAnswer = (currentQuestion as any).correct_answer;
    const isCorrect = selectedAnswer.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();
    const pointsEarned = isCorrect ? (currentQuestion.points || 10) : 0;

    setLastAnswerResult(isCorrect);

    if (isCorrect) {
      const newScore = myScore + pointsEarned;
      const newCorrectAnswers = myCorrectAnswers + 1;
      setMyScore(newScore);
      setMyCorrectAnswers(newCorrectAnswers);

      // Update score in database
      updateScoreMutation.mutate({
        playerId: myPlayer.id,
        score: newScore,
        correctAnswers: newCorrectAnswers,
        currentQuestionIndex: currentQuestionIndex
      });

      toast.success(`Correto! +${pointsEarned} pontos`);
    } else {
      // Still update to mark that we answered
      updateScoreMutation.mutate({
        playerId: myPlayer.id,
        score: myScore,
        correctAnswers: myCorrectAnswers,
        currentQuestionIndex: currentQuestionIndex
      });

      toast.error('Resposta incorreta');
    }
  }, [currentQuestion, selectedAnswer, hasAnswered, myPlayer, myScore, myCorrectAnswers, currentQuestionIndex]);

  // Sort players by score for leaderboard
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myPosition = sortedPlayers.findIndex(p => p.user_id === user?.id) + 1;

  if (!questions || questions.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Finished state
  if (isFinished) {
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
            <div className="text-center p-6 bg-primary/10 rounded-lg">
              <p className="text-5xl font-bold mb-2">{myScore}</p>
              <p className="text-muted-foreground">Sua pontuação</p>
              <Badge variant="secondary" className="mt-2">
                {myPosition}º lugar de {players.length}
              </Badge>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Classificação Final</h3>
              {sortedPlayers.slice(0, 10).map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    player.user_id === user?.id ? 'bg-primary/20 border border-primary' : 'bg-muted/50'
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
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
                    <p className="text-sm text-muted-foreground">{player.correct_answers} acertos</p>
                  </div>
                  <p className="text-xl font-bold">{player.score}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-muted-foreground">
              Aguarde o professor distribuir os prêmios...
            </p>

            <Button onClick={onFinish} className="w-full">
              Voltar ao Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting for game to start
  if (room?.status === 'waiting') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-bold mb-2">Aguardando início...</h2>
        <p className="text-muted-foreground">O professor irá iniciar o quiz em breve</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{myScore}</p>
                  <p className="text-xs text-muted-foreground">Pontos</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentQuestionIndex + 1}/{totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">Questão</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : ''}`}>
                <Clock className="w-5 h-5" />
                <span className="text-2xl font-bold">{timeLeft}s</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">Questão {currentQuestionIndex + 1}</Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>{currentQuestion?.points || 10} pontos</span>
              </div>
            </div>
            <CardTitle className="text-xl mt-4">{currentQuestion?.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion?.options &&
              (currentQuestion.options as string[]).map((option, index) => {
                const isSelected = selectedAnswer === option;
                const showResult = hasAnswered;
                const isCorrect = option.toLowerCase().trim() === (currentQuestion as any).correct_answer?.toLowerCase().trim();

                return (
                  <Button
                    key={index}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`w-full justify-start h-auto py-4 text-left ${
                      showResult && isCorrect ? 'border-green-500 bg-green-500/20' : ''
                    } ${
                      showResult && isSelected && !isCorrect ? 'border-red-500 bg-red-500/20' : ''
                    }`}
                    onClick={() => !hasAnswered && setSelectedAnswer(option)}
                    disabled={hasAnswered}
                  >
                    <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                    <span>{option}</span>
                  </Button>
                );
              })}

            {!hasAnswered && (
              <Button
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer || hasAnswered}
                className="w-full mt-4"
                size="lg"
              >
                Responder
              </Button>
            )}

            {hasAnswered && (
              <div className={`p-4 rounded-lg text-center ${
                lastAnswerResult ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
              }`}>
                {lastAnswerResult ? '✓ Correto!' : '✗ Incorreto'}
                <p className="text-sm mt-1">Aguardando próxima questão...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Leaderboard */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Placar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    player.user_id === user?.id ? 'bg-primary/20 border border-primary' : 
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
                    {player.user_id === user?.id ? 'Você' : player.profiles?.name}
                  </span>
                  <span className="font-bold">{player.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{players.length}</p>
            <p className="text-xs text-muted-foreground">Jogadores</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}