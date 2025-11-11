import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MatchReplayProps {
  matchDetails: any;
}

export function MatchReplay({ matchDetails }: MatchReplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questions = matchDetails.quiz?.quiz_questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Get answers for current question from all players
  const getPlayerAnswers = () => {
    return matchDetails.players?.map((player: any) => {
      const attempt = player.quiz_attempts?.[0];
      const answers = attempt?.quiz_answers || [];
      const answer = answers.find((a: any) => a.question_id === currentQuestion?.id);
      
      return {
        playerName: player.profiles?.name,
        answer: answer?.user_answer,
        isCorrect: answer?.is_correct,
        timeSpent: answer?.time_spent_seconds
      };
    }).filter((a: any) => a.answer);
  };

  const playerAnswers = getPlayerAnswers();
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Nenhuma questão disponível para replay</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso do Replay</span>
              <span className="text-muted-foreground">
                Questão {currentQuestionIndex + 1} de {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Questão {currentQuestionIndex + 1}</span>
            <Badge variant="secondary">{currentQuestion.points} pontos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-lg font-medium mb-4">{currentQuestion.question_text}</p>
            
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <div className="grid gap-2">
                {(currentQuestion.options as string[]).map((option, index) => {
                  const isCorrect = option === currentQuestion.correct_answer;
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 ${
                        isCorrect
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                        <span>{option}</span>
                        {isCorrect && <Badge variant="secondary" className="ml-auto">Correta</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.question_type === 'open_ended' && (
              <Card className="bg-green-500/10 border-green-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Resposta Correta:</p>
                      <p>{currentQuestion.correct_answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Player Answers */}
          <div>
            <h4 className="font-semibold mb-3">Respostas dos Jogadores</h4>
            <div className="space-y-2">
              {playerAnswers.map((playerAnswer: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {playerAnswer.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{playerAnswer.playerName}</p>
                          <p className="text-sm text-muted-foreground">{playerAnswer.answer}</p>
                        </div>
                      </div>
                      {playerAnswer.timeSpent && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{playerAnswer.timeSpent}s</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {playerAnswers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum jogador respondeu esta questão
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Próxima
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
