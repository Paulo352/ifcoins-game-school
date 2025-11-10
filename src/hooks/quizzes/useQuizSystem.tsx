import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  reward_coins: number;
  reward_type?: string;
  reward_card_id?: string;
  max_attempts?: number;
  time_limit_minutes?: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_email?: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options?: string[] | Record<string, any>;
  correct_answer?: string; // Opcional para estudantes (segurança)
  points: number;
  question_order: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  coins_earned: number;
  started_at: string;
  completed_at?: string;
  is_completed: boolean;
  time_taken_seconds?: number;
  practice_mode?: boolean;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  points_earned: number;
  answered_at?: string;
  quiz_questions?: {
    question_text: string;
    correct_answer: string;
    points: number;
  } | null;
}

// ============================================
// HOOKS DE BUSCA (READ)
// ============================================

/**
 * Busca todos os quizzes ativos (disponíveis para estudantes)
 */
export function useActiveQuizzes() {
  return useQuery({
    queryKey: ['quizzes', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          creator:profiles!quizzes_created_by_fkey(id, name, email)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(quiz => ({
        ...quiz,
        creator_name: quiz.creator?.name || 'Desconhecido',
        creator_email: quiz.creator?.email
      })) as Quiz[];
    },
    staleTime: 30000, // Cache por 30 segundos
  });
}

/**
 * Busca todos os quizzes (para admin/professor)
 */
export function useAllQuizzes() {
  return useQuery({
    queryKey: ['quizzes', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          creator:profiles!quizzes_created_by_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(quiz => ({
        ...quiz,
        creator_name: quiz.creator?.name || 'Desconhecido',
        creator_email: quiz.creator?.email
      })) as Quiz[];
    }
  });
}

/**
 * Busca perguntas de um quiz específico
 * IMPORTANTE: Não retorna correct_answer para estudantes (segurança)
 */
export function useQuizQuestions(quizId: string | null) {
  const { profile } = useAuth();
  const isStudent = profile?.role === 'student';

  return useQuery({
    queryKey: ['quiz-questions', quizId, isStudent],
    queryFn: async () => {
      if (!quizId) return [];

      // Para estudantes: excluir correct_answer (segurança)
      const selectFields = isStudent
        ? 'id, quiz_id, question_text, question_type, options, points, question_order'
        : '*';

      const { data, error } = await supabase
        .from('quiz_questions')
        .select(selectFields)
        .eq('quiz_id', quizId)
        .order('question_order', { ascending: true });

      if (error) throw error;
      return (data || []) as QuizQuestion[];
    },
    enabled: !!quizId,
  });
}

/**
 * Busca todas as tentativas de quiz do usuário logado
 */
export function useUserQuizAttempts() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['user-quiz-attempts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(title, reward_coins)
        `)
        .eq('user_id', profile.id)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as (QuizAttempt & { quiz: any })[];
    },
    enabled: !!profile?.id,
  });
}

/**
 * Busca tentativas de um quiz específico (admin/professor)
 */
export function useQuizAttempts(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: async () => {
      if (!quizId) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          user:profiles!quiz_attempts_user_id_fkey(id, name, email, role)
        `)
        .eq('quiz_id', quizId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return (data || []) as (QuizAttempt & { user: any })[];
    },
    enabled: !!quizId,
  });
}

/**
 * Busca respostas de uma tentativa específica
 */
export function useAttemptAnswers(attemptId: string | null) {
  return useQuery({
    queryKey: ['attempt-answers', attemptId],
    queryFn: async () => {
      if (!attemptId) return [];

      const { data, error } = await supabase
        .from('quiz_answers')
        .select(`
          *,
          quiz_questions(question_text, correct_answer, points)
        `)
        .eq('attempt_id', attemptId)
        .order('answered_at', { ascending: true});

      if (error) throw error;
      return (data || []) as QuizAnswer[];
    },
    enabled: !!attemptId,
  });
}

/**
 * Busca badges de quiz do usuário
 */
export function useUserQuizBadges() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['user-quiz-badges', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('user_quiz_badges')
        .select(`
          *,
          badge:quiz_badges(*)
        `)
        .eq('user_id', profile.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });
}

/**
 * Busca todos os badges disponíveis
 */
export function useQuizBadges() {
  return useQuery({
    queryKey: ['quiz-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_badges')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });
}

// ============================================
// HOOKS DE MUTAÇÃO (CREATE/UPDATE/DELETE)
// ============================================

/**
 * Inicia uma nova tentativa de quiz
 */
export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ quizId, practiceMode = false }: { quizId: string; practiceMode?: boolean }) => {
      if (!profile?.id) throw new Error('Usuário não autenticado');

      // Contar perguntas
      const { count, error: countError } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId);

      if (countError) throw countError;
      if (!count || count === 0) throw new Error('Quiz sem perguntas');

      // Criar tentativa
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: profile.id,
          total_questions: count,
          score: 0,
          correct_answers: 0,
          is_completed: false,
          practice_mode: practiceMode
        })
        .select()
        .single();

      if (error) throw error;
      return data as QuizAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-attempts'] });
      toast.success('Quiz iniciado!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao iniciar quiz');
    },
  });
}

/**
 * Salva a resposta de uma pergunta
 */
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
      // Normalizar respostas
      const normalize = (answer: string) => {
        const norm = answer.toLowerCase().trim();
        if (norm === 'verdadeiro' || norm === 'true') return 'true';
        if (norm === 'falso' || norm === 'false') return 'false';
        return norm;
      };

      const isCorrect = normalize(userAnswer) === normalize(correctAnswer);
      const pointsEarned = isCorrect ? points : 0;

      // Inserir resposta (trigger atualiza score automaticamente)
      const { error } = await supabase
        .from('quiz_answers')
        .insert({
          attempt_id: attemptId,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned
        });

      if (error) throw error;
      return { isCorrect, pointsEarned };
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar resposta');
      console.error('Erro ao salvar resposta:', error);
    },
  });
}

/**
 * Completa um quiz e processa recompensas
 */
export function useCompleteQuiz() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ attemptId }: { attemptId: string }) => {
      if (!profile?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('complete_quiz', {
        attempt_id: attemptId,
        user_id: profile.id
      });

      if (error) throw error;

      // Conceder badges (não bloqueia se falhar)
      try {
        await supabase.rpc('check_and_award_quiz_badges', {
          p_user_id: profile.id,
          p_attempt_id: attemptId
        });
      } catch (badgeError) {
        console.error('Erro ao conceder badges:', badgeError);
      }

      return data as unknown as {
        success: boolean;
        coins_earned: number;
        score: number;
        correct_answers: number;
        total_questions: number;
        percentage: number;
        passed: boolean;
        practice_mode: boolean;
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-ranking'] });
      queryClient.invalidateQueries({ queryKey: ['user-quiz-badges'] });
      
      if (result.practice_mode) {
        toast.success('Prática concluída!');
      } else if (result.passed) {
        toast.success(`Parabéns! +${result.coins_earned} moedas!`);
      } else {
        toast.info(`Quiz concluído! ${result.percentage}% de acertos.`);
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao completar quiz');
      console.error('Erro ao completar quiz:', error);
    },
  });
}
