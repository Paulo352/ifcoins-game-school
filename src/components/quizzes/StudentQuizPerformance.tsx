import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface StudentQuizPerformanceProps {
  studentId: string;
  quizId: string;
  onBack: () => void;
}

export function StudentQuizPerformance({
  studentId,
  quizId,
  onBack,
}: StudentQuizPerformanceProps) {
  const { data: student } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: quiz } = useQuery({
    queryKey: ['quiz-details', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: attempts, isLoading } = useQuery({
    queryKey: ['student-quiz-attempts', studentId, quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz_answers (
            id,
            question_id,
            user_answer,
            is_correct,
            points_earned,
            quiz_questions (
              question_text,
              correct_answer,
              options,
              points
            )
          )
        `)
        .eq('user_id', studentId)
        .eq('quiz_id', quizId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho do Aluno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Aluno:</strong> {student?.name}
            </p>
            <p>
              <strong>Email:</strong> {student?.email}
            </p>
            {student?.ra && (
              <p>
                <strong>RA:</strong> {student.ra}
              </p>
            )}
            {student?.class && (
              <p>
                <strong>Turma:</strong> {student.class}
              </p>
            )}
            <p>
              <strong>Quiz:</strong> {quiz?.title}
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : attempts && attempts.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Tentativas ({attempts.length})
          </h3>
          {attempts.map((attempt: any, index: number) => {
            const percentage = (attempt.score / attempt.total_questions) * 100;
            const passed = percentage >= 70;

            return (
              <Card key={attempt.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Tentativa #{attempts.length - index}
                    </CardTitle>
                    <Badge variant={passed ? 'default' : 'destructive'}>
                      {passed ? 'Aprovado' : 'Reprovado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Pontuação</p>
                      <p className="font-semibold">
                        {attempt.score} / {attempt.total_questions}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Percentual</p>
                      <p className="font-semibold">{percentage.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tempo</p>
                      <p className="font-semibold">
                        {formatDuration(attempt.time_taken_seconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Concluído em</p>
                      <p className="font-semibold text-xs">
                        {formatDate(attempt.completed_at)}
                      </p>
                    </div>
                  </div>

                  {attempt.quiz_answers && attempt.quiz_answers.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <h4 className="font-semibold">Respostas:</h4>
                      {attempt.quiz_answers.map((answer: any, qIndex: number) => {
                        // Handle quiz_questions which might be an object or array
                        const questionData = Array.isArray(answer.quiz_questions) 
                          ? answer.quiz_questions[0] 
                          : answer.quiz_questions;
                        
                        const questionText = typeof questionData?.question_text === 'string' 
                          ? questionData.question_text 
                          : 'Questão';
                        const correctAnswer = typeof questionData?.correct_answer === 'string'
                          ? questionData.correct_answer
                          : String(questionData?.correct_answer || '-');
                        const points = typeof questionData?.points === 'number'
                          ? questionData.points
                          : 0;
                        const userAnswer = typeof answer.user_answer === 'string'
                          ? answer.user_answer
                          : String(answer.user_answer || '-');
                        const pointsEarned = typeof answer.points_earned === 'number'
                          ? answer.points_earned
                          : 0;

                        return (
                          <Card key={answer.id} className="p-4">
                            <div className="flex items-start gap-3">
                              {answer.is_correct ? (
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
                              )}
                              <div className="flex-1 space-y-2">
                                <p className="font-medium">
                                  Questão {qIndex + 1}: {questionText}
                                </p>
                                <div className="text-sm space-y-1">
                                  <p>
                                    <strong>Resposta do aluno:</strong>{' '}
                                    <span
                                      className={
                                        answer.is_correct
                                          ? 'text-green-600'
                                          : 'text-red-600'
                                      }
                                    >
                                      {userAnswer}
                                    </span>
                                  </p>
                                  {!answer.is_correct && (
                                    <p>
                                      <strong>Resposta correta:</strong>{' '}
                                      <span className="text-green-600">
                                        {correctAnswer}
                                      </span>
                                    </p>
                                  )}
                                  <p className="text-muted-foreground">
                                    Pontos: {pointsEarned} / {points}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma tentativa completa encontrada
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
