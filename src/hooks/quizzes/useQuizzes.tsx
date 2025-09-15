import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  reward_coins: number;
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
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  coins_earned: number;
  started_at: string;
  completed_at: string | null;
  time_taken_seconds: number | null;
  is_completed: boolean;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  points_earned: number;
  answered_at: string;
}

export interface CreateQuizData {
  title: string;
  description?: string;
  reward_coins: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  questions: {
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'open_text';
    options?: string[];
    correct_answer: string;
    points: number;
  }[];
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
    },
  });
}

// Hook para buscar todos os quizzes (para professores/admins)
export function useAllQuizzes() {
  return useQuery({
    queryKey: ['all-quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Quiz[];
    },
  });
}

// Hook para buscar perguntas de um quiz
export function useQuizQuestions(quizId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      if (!quizId) return [];
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_order');
      
      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: !!quizId,
  });
}

// Hook para buscar tentativas do usuário
export function useUserAttempts(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-attempts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(title)
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Hook para criar quiz
export function useCreateQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quizData: CreateQuizData) => {
      // Criar o quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert([{
          title: quizData.title,
          description: quizData.description,
          reward_coins: quizData.reward_coins,
          max_attempts: quizData.max_attempts || 1,
          time_limit_minutes: quizData.time_limit_minutes,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (quizError) throw quizError;

      // Adicionar as perguntas
      const questions = quizData.questions.map((question, index) => ({
        quiz_id: quiz.id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options || null,
        correct_answer: question.correct_answer,
        points: question.points,
        question_order: index
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions);

      if (questionsError) throw questionsError;
      
      return quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
      toast({
        title: "Quiz criado!",
        description: "O quiz foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar quiz:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o quiz.",
        variant: "destructive",
      });
    },
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
      console.log('Iniciando quiz attempt:', { quizId, userId, totalQuestions });
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([{
          quiz_id: quizId,
          user_id: userId,
          total_questions: totalQuestions
        }])
        .select()
        .single();
      
      console.log('Resultado insert attempt:', { data, error });
      
      if (error) {
        console.error('Erro detalhado ao inserir attempt:', error);
        throw error;
      }
      return data as QuizAttempt;
    },
    onSuccess: (data) => {
      console.log('Quiz attempt criado com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['user-attempts'] });
    },
    onError: (error) => {
      console.error('Erro ao iniciar quiz:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o quiz.",
        variant: "destructive",
      });
    },
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
        .insert([{
          attempt_id: attemptId,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned
        }])
        .select()
        .single();
      
      if (error) throw error;

      // Atualizar pontuação da tentativa usando a função criada
      const { error: updateError } = await supabase.rpc('update_quiz_score', {
        attempt_id: attemptId,
        points_to_add: pointsEarned
      });

      if (updateError) {
        // Fallback: atualizar manualmente
        const { data: currentAttempt, error: fetchError } = await supabase
          .from('quiz_attempts')
          .select('score')
          .eq('id', attemptId)
          .single();

        if (!fetchError && currentAttempt) {
          await supabase
            .from('quiz_attempts')
            .update({ score: currentAttempt.score + pointsEarned })
            .eq('id', attemptId);
        }
      }
      
      return { ...data, isCorrect, pointsEarned };
    },
    onError: (error) => {
      console.error('Erro ao responder pergunta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a resposta.",
        variant: "destructive",
      });
    },
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['user-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      if (data?.success) {
        const passed = data.passed;
        const coinsEarned = data.coins_earned;
        
        toast({
          title: passed ? "Parabéns!" : "Quiz Finalizado",
          description: passed ? 
            `Você passou no quiz e ganhou ${coinsEarned} moedas!` : 
            "Você não atingiu a pontuação mínima (70%), mas pode tentar novamente.",
          variant: passed ? "default" : "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao completar quiz:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o quiz.",
        variant: "destructive",
      });
    },
  });
}

// Hook para deletar quiz
export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
      toast({
        title: "Quiz removido!",
        description: "O quiz foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao remover quiz:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o quiz.",
        variant: "destructive",
      });
    },
  });
}

// Hook para atualizar status do quiz
export function useUpdateQuizStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quizId, isActive }: { quizId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ is_active: isActive })
        .eq('id', quizId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
      toast({
        title: "Status atualizado!",
        description: "O status do quiz foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar quiz:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o quiz.",
        variant: "destructive",
      });
    },
  });
}