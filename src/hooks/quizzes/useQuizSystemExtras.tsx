import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuizAttempt, QuizAnswer, QuizQuestion, Quiz } from './useQuizSystem';

export interface AttemptWithProfile {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  coins_earned: number;
  started_at: string;
  completed_at?: string;
  time_taken_seconds?: number;
  is_completed: boolean;
  profiles: {
    id?: string;
    name: string;
    email: string;
    role?: string;
  };
}

export interface AnswerWithQuestion {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  points_earned: number;
  answered_at: string;
  quiz_questions: {
    id?: string;
    question_text: string;
    question_type?: string;
    options?: any;
    correct_answer: string;
    points: number;
    quiz_id?: string;
    question_order?: number;
  };
}

// Hook para buscar tentativas de um quiz específico (para professores/admins)
export function useQuizAttempts(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: async (): Promise<AttemptWithProfile[]> => {
      if (!quizId) return [];
      
      console.log('🎯 [useQuizAttempts] Buscando tentativas do quiz:', quizId);

      // Primeiro, buscar as tentativas
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .order('started_at', { ascending: false });

      if (attemptsError) {
        console.error('❌ [useQuizAttempts] Erro ao buscar tentativas:', attemptsError);
        throw attemptsError;
      }

      if (!attempts || attempts.length === 0) {
        return [];
      }

      // Buscar dados dos usuários
      const userIds = [...new Set(attempts.map(a => a.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ [useQuizAttempts] Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      // Combinar os dados
      const result: AttemptWithProfile[] = attempts.map(attempt => ({
        ...attempt,
        profiles: profiles?.find(p => p.id === attempt.user_id) || { name: 'Usuário desconhecido', email: 'N/A' }
      }));

      console.log('✅ [useQuizAttempts] Tentativas encontradas:', result.length);
      return result;
    },
    enabled: !!quizId,
    staleTime: 30000,
    retry: 1
  });
}

// Hook para buscar respostas detalhadas de uma tentativa
export function useAttemptAnswers(attemptId: string | null) {
  return useQuery({
    queryKey: ['attempt-answers', attemptId],
    queryFn: async (): Promise<AnswerWithQuestion[]> => {
      if (!attemptId) return [];
      
      console.log('🎯 [useAttemptAnswers] Buscando respostas da tentativa:', attemptId);

      // Primeiro, buscar as respostas
      const { data: answers, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .eq('attempt_id', attemptId)
        .order('answered_at', { ascending: true });

      if (answersError) {
        console.error('❌ [useAttemptAnswers] Erro ao buscar respostas:', answersError);
        throw answersError;
      }

      if (!answers || answers.length === 0) {
        return [];
      }

      // Buscar dados das perguntas
      const questionIds = [...new Set(answers.map(a => a.question_id))];
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .in('id', questionIds);

      if (questionsError) {
        console.error('❌ [useAttemptAnswers] Erro ao buscar perguntas:', questionsError);
        throw questionsError;
      }

      // Combinar os dados
      const result: AnswerWithQuestion[] = answers.map(answer => ({
        ...answer,
        quiz_questions: questions?.find(q => q.id === answer.question_id) || { 
          question_text: 'Pergunta não encontrada', 
          correct_answer: 'N/A',
          points: 0
        }
      }));

      console.log('✅ [useAttemptAnswers] Respostas encontradas:', result.length);
      return result;
    },
    enabled: !!attemptId,
    staleTime: 30000,
    retry: 1
  });
}

export type { Quiz };