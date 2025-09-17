import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuizAttempt, QuizAnswer, QuizQuestion, Quiz } from './useQuizSystem';

// Hook para buscar tentativas de um quiz específico (para professores/admins)
export function useQuizAttempts(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: async () => {
      if (!quizId) return [];
      
      console.log('🎯 [useQuizAttempts] Buscando tentativas do quiz:', quizId);
      
      // Verificar primeiro se o usuário atual tem permissão
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      console.log('🎯 [useQuizAttempts] Profile do usuário:', profile);
      
      if (profileError) {
        console.error('❌ [useQuizAttempts] Erro ao buscar profile:', profileError);
        throw profileError;
      }

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
        console.error('❌ [useQuizAttempts] Erro ao buscar tentativas do quiz:', error);
        throw error;
      }

      console.log('✅ [useQuizAttempts] Tentativas encontradas:', data?.length || 0, data);
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
      
      console.log('🎯 [useAttemptAnswers] Buscando respostas da tentativa:', attemptId);
      
      // Verificar primeiro se o usuário atual tem permissão
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      console.log('🎯 [useAttemptAnswers] Profile do usuário:', profile);
      
      if (profileError) {
        console.error('❌ [useAttemptAnswers] Erro ao buscar profile:', profileError);
        throw profileError;
      }

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
        console.error('❌ [useAttemptAnswers] Erro ao buscar respostas da tentativa:', error);
        throw error;
      }

      console.log('✅ [useAttemptAnswers] Respostas encontradas:', data?.length || 0, data);
      return data as any[];
    },
    enabled: !!attemptId,
  });
}

export type { Quiz };