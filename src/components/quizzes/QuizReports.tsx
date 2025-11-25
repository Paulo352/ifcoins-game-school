import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, FileText } from 'lucide-react';
import { StudentQuizPerformance } from './StudentQuizPerformance';
import { Skeleton } from '@/components/ui/skeleton';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  reward_coins: number;
  is_active: boolean;
  created_by: string;
  profiles?: {
    name: string;
    role: string;
  } | null;
}

interface QuizReportsProps {
  onBack: () => void;
}

export function QuizReports({ onBack }: QuizReportsProps) {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // All hooks must be at the top before any conditional returns
  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['quizzes-for-reports'],
    queryFn: async () => {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar apenas quizzes criados pelo usuário atual
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (quizzesError) throw quizzesError;
      
      if (!quizzesData || quizzesData.length === 0) {
        return [];
      }

      // Buscar dados dos criadores
      const creatorIds = [...new Set(quizzesData.map(q => q.created_by).filter(Boolean))];
      
      if (creatorIds.length === 0) {
        return quizzesData.map(quiz => ({
          ...quiz,
          profiles: null,
        })) as Quiz[];
      }
      
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('id', creatorIds);

      if (creatorsError) {
        console.error('Error fetching creators:', creatorsError);
        return quizzesData.map(quiz => ({
          ...quiz,
          profiles: null,
        })) as Quiz[];
      }

      // Combinar dados
      const creatorsMap = new Map(creatorsData?.map(c => [c.id, c]) || []);
      const quizzesWithCreators = quizzesData.map(quiz => ({
        ...quiz,
        profiles: creatorsMap.get(quiz.created_by) || null,
      }));

      return quizzesWithCreators as Quiz[];
    },
  });

  const { data: studentsWithAttempts, isLoading: loadingStudents } = useQuery({
    queryKey: ['quiz-students', selectedQuizId],
    enabled: !!selectedQuizId,
    queryFn: async () => {
      if (!selectedQuizId) return [];

      const { data: attemptsData, error } = await supabase
        .from('quiz_attempts')
        .select('id, user_id, score, total_questions, is_completed, completed_at')
        .eq('quiz_id', selectedQuizId)
        .eq('is_completed', true);

      if (error) throw error;
      if (!attemptsData || attemptsData.length === 0) return [];

      // Get unique student IDs
      const studentIds = [...new Set(attemptsData.map(a => a.user_id))];
      
      // Fetch student profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, ra, class')
        .in('id', studentIds);

      if (profilesError) throw profilesError;

      // Create profiles map
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Group by student
      const studentMap = new Map();
      attemptsData.forEach((attempt: any) => {
        const studentId = attempt.user_id;
        const profile = profilesMap.get(studentId);
        
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            name: profile?.name || 'Aluno',
            email: profile?.email || '',
            ra: profile?.ra || null,
            class: profile?.class || null,
            attempts: [],
            bestScore: 0,
            totalAttempts: 0,
          });
        }
        const student = studentMap.get(studentId);
        student.attempts.push(attempt);
        student.totalAttempts++;
        const percentage = (attempt.score / attempt.total_questions) * 100;
        if (percentage > student.bestScore) {
          student.bestScore = percentage;
        }
      });

      return Array.from(studentMap.values());
    },
  });

  // Render student performance view
  if (selectedStudentId && selectedQuizId) {
    return (
      <StudentQuizPerformance
        studentId={selectedStudentId}
        quizId={selectedQuizId}
        onBack={() => setSelectedStudentId(null)}
      />
    );
  }

  // Render students list for selected quiz
  if (selectedQuizId) {
    const selectedQuiz = quizzes?.find((q) => q.id === selectedQuizId);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedQuizId(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatório: {selectedQuiz?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : studentsWithAttempts && studentsWithAttempts.length > 0 ? (
              <div className="space-y-3">
                {studentsWithAttempts.map((student: any) => (
                  <Card
                    key={student.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.email}
                            {student.ra && ` • RA: ${student.ra}`}
                            {student.class && ` • Turma: ${student.class}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Melhor: {student.bestScore.toFixed(0)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.totalAttempts} tentativa(s)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum aluno respondeu este quiz ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render quizzes list
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="self-start">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h2 className="text-xl sm:text-2xl font-bold">Relatórios de Quiz</h2>
        <div className="hidden sm:block w-20" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecione um Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingQuizzes ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedQuizId(quiz.id)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {quiz.description}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm">
                      <span className="text-muted-foreground">
                        Recompensa: {quiz.reward_coins} moedas
                      </span>
                      <span
                        className={
                          quiz.is_active ? 'text-green-600' : 'text-gray-500'
                        }
                      >
                        {quiz.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="text-muted-foreground">
                        Criado por: {quiz.profiles?.role === 'admin' ? 'Sistema' : quiz.profiles?.name || 'Desconhecido'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum quiz disponível
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
