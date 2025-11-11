import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
  coins_earned: number;
  time_taken_seconds: number | null;
  practice_mode: boolean;
}

// Hook para buscar tentativas do usuário
export function useUserAttempts(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-quiz-attempts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data as QuizAttempt[];
    },
    enabled: !!userId
  });
}

// Hook para iniciar tentativa de quiz usando RPC
export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      quizId, 
      userId, 
      practiceMode = false 
    }: { 
      quizId: string; 
      userId: string;
      practiceMode?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('start_quiz_attempt', {
        p_quiz_id: quizId,
        p_user_id: userId,
        p_practice_mode: practiceMode
      });

      if (error) throw error;
      
      const result = data as { success: boolean; attempt_id: string; practice_mode: boolean; error?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao iniciar quiz');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-attempts'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao iniciar quiz:', error);
      toast.error(error.message || 'Erro ao iniciar quiz');
    }
  });
}

// Hook para completar quiz usando RPC
export function useCompleteQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ attemptId, userId }: { attemptId: string; userId: string }) => {
      const { data, error } = await supabase.rpc('complete_quiz', {
        attempt_id: attemptId,
        user_id: userId
      });
      
      if (error) throw error;
      
      const result = data as any;
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao completar quiz');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao completar quiz:', error);
      toast.error(error.message || 'Erro ao completar quiz');
    }
  });
}

// Hook para buscar respostas de uma tentativa
export function useAttemptAnswers(attemptId: string) {
  return useQuery({
    queryKey: ['attempt-answers', attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_answers')
        .select(`
          *,
          quiz_questions!inner(question_text, correct_answer)
        `)
        .eq('attempt_id', attemptId)
        .order('answered_at');
      
      if (error) throw error;
      return data;
    },
    enabled: !!attemptId
  });
}

// Hook para buscar tentativas de quiz (todas - para admin/teacher)
export function useAllQuizAttempts(quizId?: string) {
  return useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: async () => {
      let query = supabase
        .from('quiz_attempts')
        .select('*, profiles!inner(name, email)')
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });
      
      if (quizId) {
        query = query.eq('quiz_id', quizId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: true
  });
}
