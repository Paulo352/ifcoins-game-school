import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, X, GraduationCap } from 'lucide-react';

interface QuizResultsProps {
  correctAnswers: number;
  totalQuestions: number;
  coinsEarned: number;
  passed: boolean;
  questions: Array<{
    id: string;
    question_text: string;
  }>;
  userAnswers: Record<string, string>;
  practiceMode?: boolean;
  onBack: () => void;
}

export function QuizResults({ 
  correctAnswers, 
  totalQuestions, 
  coinsEarned, 
  passed, 
  questions, 
  userAnswers,
  practiceMode = false,
  onBack 
}: QuizResultsProps) {
  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

  return (
    <div className="space-y-6">
      {/* Resultado Geral */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {practiceMode && (
              <Badge variant="secondary" className="mb-2 gap-1">
                <GraduationCap className="w-4 h-4" />
                Modo Prática
              </Badge>
            )}
            
            {passed ? (
              <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
            ) : (
              <X className="w-16 h-16 mx-auto text-red-500" />
            )}
            
            <div>
              <h2 className="text-2xl font-bold">
                {passed ? 'Parabéns! 🎉' : 'Quase lá! 💪'}
              </h2>
              <p className="text-muted-foreground mt-2">
                Você acertou {correctAnswers} de {totalQuestions} questões
              </p>
              <p className="text-3xl font-bold mt-2">
                {scorePercentage}%
              </p>
            </div>

            {!practiceMode && coinsEarned > 0 && (
              <Badge variant="default" className="text-lg px-4 py-2">
                +{coinsEarned} moedas ganhas! 🪙
              </Badge>
            )}
            
            {practiceMode && (
              <p className="text-sm text-muted-foreground">
                No modo prática você não ganha moedas
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revisão das Questões - Simplificada */}
      <Card>
        <CardHeader>
          <CardTitle>Revisão das Questões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Veja suas respostas e quantas você acertou!
          </p>
          {questions.map((question, index) => {
            const userAnswer = userAnswers[question.id];
            
            return (
              <div 
                key={question.id} 
                className="p-4 rounded-lg border"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">
                      {index + 1}. {question.question_text}
                    </p>
                    
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-semibold">Sua resposta:</span>{' '}
                        <span>
                          {userAnswer || '(não respondida)'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Botão de Voltar */}
      <Button onClick={onBack} className="w-full" size="lg">
        Voltar aos Quizzes
      </Button>
    </div>
  );
}
