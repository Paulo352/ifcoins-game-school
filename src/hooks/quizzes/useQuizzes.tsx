import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  reward_coins: number;
  reward_type: string;
  reward_card_id: string | null;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'open_text';
  options: string[] | null;
  correct_answer: string;
  points: number;
  question_order: number;
}

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

export interface CreateQuizData {
  title: string;
  description?: string;
  reward_type: 'coins' | 'card';
  reward_coins: number;
  reward_card_id?: string;
  max_attempts?: number;
  time_limit_minutes?: number;
  questions: Array<{
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'open_text';
    options?: string[];
    correct_answer: string;
    points: number;
  }>;
}

// Hook para buscar quizzes ativos
export function useActiveQuizzes() {
  return useQuery({
    queryKey: ['active-quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Quiz[];
    }
  });
}

// Hook para buscar perguntas de um quiz
export function useQuizQuestions(quizId: string) {
  return useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_order');
      
      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: !!quizId
  });
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

// Hook para iniciar tentativa de quiz
export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quizId, userId, totalQuestions }: { 
      quizId: string; 
      userId: string; 
      totalQuestions: number;
    }) => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: userId,
          total_questions: totalQuestions,
          score: 0,
          correct_answers: 0,
          is_completed: false,
          coins_earned: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as QuizAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-attempts'] });
    }
  });
}

// Hook para responder pergunta
export function useAnswerQuestion() {
  return useMutation({
    mutationFn: async ({ 
      attemptId, 
      questionId, 
      userAnswer, 
      correctAnswer, 
      points 
    }: {
      attemptId: string;
      questionId: string;
      userAnswer: string;
      correctAnswer: string;
      points: number;
    }) => {
      const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      const pointsEarned = isCorrect ? points : 0;
      
      const { data, error } = await supabase
        .from('quiz_answers')
        .insert({
          attempt_id: attemptId,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { isCorrect, pointsEarned };
    }
  });
}

// Hook para completar quiz
export function useCompleteQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ attemptId, userId }: { attemptId: string; userId: string }) => {
      const { data, error } = await supabase.rpc('complete_quiz', {
        attempt_id: attemptId,
        user_id: userId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
}

// Hook para criar quiz
export function useCreateQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quizData: CreateQuizData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Criar quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quizData.title,
          description: quizData.description,
          reward_type: quizData.reward_type,
          reward_coins: quizData.reward_coins,
          reward_card_id: quizData.reward_card_id,
          max_attempts: quizData.max_attempts,
          time_limit_minutes: quizData.time_limit_minutes,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();
      
      if (quizError) throw quizError;
      
      // Criar perguntas
      const questions = quizData.questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || null,
        correct_answer: q.correct_answer,
        points: q.points,
        question_order: index
      }));
      
      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions);
      
      if (questionsError) throw questionsError;
      
      return quiz;
    },
    onSuccess: () => {
      toast.success('Quiz criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['active-quizzes'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao criar quiz: ' + error.message);
    }
  });
}

// Hook para deletar quiz
export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quizId: string) => {
      // Deletar perguntas primeiro
      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);
      
      if (questionsError) throw questionsError;
      
      // Deletar quiz
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Quiz removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['active-quizzes'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao remover quiz: ' + error.message);
    }
  });
}

// Hook para atualizar status do quiz
export function useUpdateQuizStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quizId, isActive }: { quizId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: isActive })
        .eq('id', quizId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['active-quizzes'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });
}

// Hook para buscar tentativas de quiz (todas)
export function useQuizAttempts(quizId?: string) {
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

