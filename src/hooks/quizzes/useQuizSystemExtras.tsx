import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Quiz } from './useQuizSystem';

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

// Hook simplificado para buscar tentativas de um quiz específico
export function useQuizAttempts(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: async (): Promise<AttemptWithProfile[]> => {
      if (!quizId) return [];
      
      try {
        console.log('🎯 [useQuizAttempts] Buscando tentativas do quiz:', quizId);

        // Buscar tentativas de forma direta
        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizId)
          .order('started_at', { ascending: false });

        if (attemptsError) {
          console.error('❌ [useQuizAttempts] Erro ao buscar tentativas:', attemptsError);
          return [];
        }

        if (!attempts || attempts.length === 0) {
          console.log('📝 [useQuizAttempts] Nenhuma tentativa encontrada');
          return [];
        }

        // Buscar perfis de usuários de forma separada e segura
        const userIds = [...new Set(attempts.map(a => a.user_id))];
        
        if (userIds.length === 0) return [];

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ [useQuizAttempts] Erro ao buscar profiles:', profilesError);
          // Retornar tentativas mesmo sem perfis, com dados padrão
          return attempts.map(attempt => ({
            ...attempt,
            profiles: { name: 'Usuário desconhecido', email: 'N/A' }
          }));
        }

        // Combinar dados com validação robusta
        const result: AttemptWithProfile[] = attempts.map(attempt => {
          const profile = profiles?.find(p => p.id === attempt.user_id);
          return {
            ...attempt,
            profiles: profile || { name: 'Usuário desconhecido', email: 'N/A' }
          };
        });

        console.log('✅ [useQuizAttempts] Tentativas encontradas:', result.length);
        return result;

      } catch (error) {
        console.error('❌ [useQuizAttempts] Erro geral:', error);
        return [];
      }
    },
    enabled: !!quizId,
    staleTime: 30000,
    retry: false,
    refetchOnWindowFocus: false
  });
}

// Hook simplificado para buscar respostas detalhadas de uma tentativa
export function useAttemptAnswers(attemptId: string | null) {
  return useQuery({
    queryKey: ['attempt-answers', attemptId],
    queryFn: async (): Promise<AnswerWithQuestion[]> => {
      if (!attemptId) return [];
      
      try {
        console.log('🎯 [useAttemptAnswers] Buscando respostas da tentativa:', attemptId);

        // Buscar respostas de forma direta
        const { data: answers, error: answersError } = await supabase
          .from('quiz_answers')
          .select('*')
          .eq('attempt_id', attemptId)
          .order('answered_at', { ascending: true });

        if (answersError) {
          console.error('❌ [useAttemptAnswers] Erro ao buscar respostas:', answersError);
          return [];
        }

        if (!answers || answers.length === 0) {
          console.log('📝 [useAttemptAnswers] Nenhuma resposta encontrada');
          return [];
        }

        // Buscar perguntas de forma separada e segura
        const questionIds = [...new Set(answers.map(a => a.question_id))];
        
        if (questionIds.length === 0) return [];

        const { data: questions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .in('id', questionIds);

        if (questionsError) {
          console.error('❌ [useAttemptAnswers] Erro ao buscar perguntas:', questionsError);
          // Retornar respostas mesmo sem perguntas, com dados padrão
          return answers.map(answer => ({
            ...answer,
            quiz_questions: { 
              question_text: 'Pergunta não encontrada', 
              correct_answer: 'N/A',
              points: 0
            }
          }));
        }

        // Combinar dados com validação robusta
        const result: AnswerWithQuestion[] = answers.map(answer => {
          const question = questions?.find(q => q.id === answer.question_id);
          return {
            ...answer,
            quiz_questions: question || { 
              question_text: 'Pergunta não encontrada', 
              correct_answer: 'N/A',
              points: 0
            }
          };
        });

        console.log('✅ [useAttemptAnswers] Respostas encontradas:', result.length);
        return result;

      } catch (error) {
        console.error('❌ [useAttemptAnswers] Erro geral:', error);
        return [];
      }
    },
    enabled: !!attemptId,
    staleTime: 30000,
    retry: false,
    refetchOnWindowFocus: false
  });
}

export type { Quiz };