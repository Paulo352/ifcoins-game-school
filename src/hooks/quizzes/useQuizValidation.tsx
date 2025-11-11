import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ValidateAnswerParams {
  attemptId: string;
  questionId: string;
  userAnswer: string;
  userId: string;
}

export interface ValidationResult {
  success: boolean;
  is_correct: boolean;
  points_earned: number;
  error?: string;
}

export function useValidateAnswer() {
  return useMutation({
    mutationFn: async ({ attemptId, questionId, userAnswer, userId }: ValidateAnswerParams) => {
      const { data, error } = await supabase.rpc('validate_quiz_answer', {
        p_attempt_id: attemptId,
        p_question_id: questionId,
        p_user_answer: userAnswer,
        p_user_id: userId
      });

      if (error) throw error;
      
      // Cast data to our expected type
      const result = data as unknown as ValidationResult;
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Erro ao validar resposta');
      }

      return result;
    },
    onError: (error: any) => {
      console.error('❌ Erro ao validar resposta:', error);
      toast.error('Erro ao validar resposta');
    }
  });
}
