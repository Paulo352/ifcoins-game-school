import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuizAttempt, QuizAnswer, QuizQuestion, Quiz } from './useQuizSystem';

// Hook para buscar tentativas de um quiz específico (para professores/admins)
export function useQuizAttempts(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: async () => {
      if (!quizId) return [];
      
      console.log('🎯 Buscando tentativas do quiz:', quizId);
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            email,
            role
          )
        `)
        .eq('quiz_id', quizId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar tentativas do quiz:', error);
        throw error;
      }

      console.log('✅ Tentativas encontradas:', data?.length || 0);
      return data as any[];
    },
    enabled: !!quizId,
  });
}

// Hook para buscar respostas detalhadas de uma tentativa
export function useAttemptAnswers(attemptId: string | null) {
  return useQuery({
    queryKey: ['attempt-answers', attemptId],
    queryFn: async () => {
      if (!attemptId) return [];
      
      console.log('🎯 Buscando respostas da tentativa:', attemptId);
      
      const { data, error } = await supabase
        .from('quiz_answers')
        .select(`
          *,
          quiz_questions:question_id (
            id,
            question_text,
            question_type,
            options,
            correct_answer,
            points,
            quiz_id,
            question_order
          )
        `)
        .eq('attempt_id', attemptId)
        .order('answered_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar respostas da tentativa:', error);
        throw error;
      }

      console.log('✅ Respostas encontradas:', data?.length || 0);
      return data as any[];
    },
    enabled: !!attemptId,
  });
}

export type { Quiz };