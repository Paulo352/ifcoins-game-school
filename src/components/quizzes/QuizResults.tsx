import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowLeft, Trophy } from 'lucide-react';
import { QuizQuestion } from '@/hooks/quizzes/useQuizSystem';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  coinsEarned: number;
  passed: boolean;
  questions: QuizQuestion[];
  userAnswers: Record<string, string>;
  onBack: () => void;
}

export function QuizResults({ 
  score, 
  totalQuestions, 
  coinsEarned, 
  passed, 
  questions,
  userAnswers,
  onBack 
}: QuizResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="space-y-6">
      {/* Resultado geral */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {passed ? (
              <Trophy className="w-16 h-16 text-yellow-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {passed ? 'Parabéns!' : 'Quiz Concluído'}
          </CardTitle>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant={passed ? 'default' : 'destructive'} className="text-lg px-4 py-2">
              {score}/{totalQuestions} ({percentage}%)
            </Badge>
            {coinsEarned > 0 && (
              <Badge variant="outline" className="text-lg px-4 py-2">
                +{coinsEarned} moedas
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            {passed 
              ? `Você passou no quiz e ganhou ${coinsEarned} moedas!` 
              : 'Você precisava de pelo menos 70% de acertos para ganhar moedas.'
            }
          </p>
        </CardHeader>
      </Card>

      {/* Revisão das respostas */}
      <Card>
        <CardHeader>
          <CardTitle>Revisão das Respostas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[question.id] || '';
            const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
            
            return (
              <div key={question.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {index + 1}. {question.question_text}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Sua resposta:</span>{' '}
                        <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {userAnswer || 'Não respondido'}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm">
                          <span className="font-medium">Resposta correta:</span>{' '}
                          <span className="text-green-600">{question.correct_answer}</span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {isCorrect ? `+${question.points}` : '0'} pontos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button onClick={onBack} className="w-full">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar aos Quizzes
      </Button>
    </div>
  );
}