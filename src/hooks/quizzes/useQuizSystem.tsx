import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  reward_coins: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_role?: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options?: any;
  correct_answer: string;
  points: number;
  question_order: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  coins_earned: number;
  started_at: string;
  completed_at?: string;
  is_completed: boolean;
  time_taken_seconds?: number;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  points_earned: number;
  answered_at?: string;
}

// Hook para buscar quizzes ativos
export function useActiveQuizzes() {
  return useQuery({
    queryKey: ['quizzes', 'active'],
    queryFn: async () => {
      console.log('🎯 Buscando quizzes ativos...');
      
      // Buscar quizzes primeiro
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar quizzes:', error);
        throw error;
      }

      if (!quizzes || quizzes.length === 0) {
        return [];
      }

      // Buscar perfis dos criadores
      const creatorIds = [...new Set(quizzes.map(q => q.created_by))];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('id', creatorIds);

      if (profilesError) {
        console.error('❌ Erro ao buscar criadores:', profilesError);
        // Retornar quizzes mesmo sem informação dos criadores
        return quizzes.map(quiz => ({
          ...quiz,
          creator_name: 'Desconhecido',
          creator_role: 'student'
        })) as Quiz[];
      }

      // Combinar dados
      const quizzesWithCreator = quizzes.map(quiz => {
        const creator = profiles?.find(p => p.id === quiz.created_by);
        return {
          ...quiz,
          creator_name: creator?.name || 'Desconhecido',
          creator_role: creator?.role || 'student'
        };
      });

      console.log('✅ Quizzes encontrados:', quizzesWithCreator.length);
      return quizzesWithCreator as Quiz[];
    },
  });
}

// Hook para buscar perguntas de um quiz
export function useQuizQuestions(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      if (!quizId) return [];
      
      console.log('🎯 Buscando perguntas do quiz:', quizId);
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_order', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar perguntas:', error);
        throw error;
      }

      console.log('✅ Perguntas encontradas:', data?.length || 0);
      return data as QuizQuestion[];
    },
    enabled: !!quizId,
  });
}

// Hook para buscar tentativas do usuário
export function useUserAttempts(userId: string | null) {
  return useQuery({
    queryKey: ['user-attempts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('🎯 Buscando tentativas do usuário:', userId);
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar tentativas:', error);
        throw error;
      }

      console.log('✅ Tentativas encontradas:', data?.length || 0);
      return data as QuizAttempt[];
    },
    enabled: !!userId,
  });
}

// Hook para iniciar uma tentativa de quiz
export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ quizId }: { quizId: string }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🎯 Iniciando tentativa de quiz:', { quizId, userId: profile.id });

      // Buscar informações do quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      // Contar total de perguntas
      const { count, error: countError } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId);

      if (countError) throw countError;

      // Criar nova tentativa
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: profile.id,
          total_questions: count || 0,
          score: 0,
          is_completed: false
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Tentativa criada:', data);
      return data as QuizAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-attempts'] });
      toast.success('Quiz iniciado!');
    },
    onError: (error) => {
      console.error('❌ Erro ao iniciar quiz:', error);
      toast.error('Erro ao iniciar quiz');
    },
  });
}

// Hook para responder uma pergunta
export function useAnswerQuestion() {
  const queryClient = useQueryClient();

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
      console.log('🎯 Respondendo pergunta:', { attemptId, questionId, userAnswer });

      // Normalizar respostas de verdadeiro/falso
      const normalizeAnswer = (answer: string) => {
        const normalized = answer.toLowerCase().trim();
        if (normalized === 'verdadeiro' || normalized === 'true') return 'true';
        if (normalized === 'falso' || normalized === 'false') return 'false';
        return normalized;
      };

      const normalizedUserAnswer = normalizeAnswer(userAnswer);
      const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);
      
      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      const pointsEarned = isCorrect ? points : 0;

      // Inserir resposta
      const { error: answerError } = await supabase
        .from('quiz_answers')
        .insert({
          attempt_id: attemptId,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned
        });

      if (answerError) throw answerError;

      // Atualizar pontuação da tentativa
      if (pointsEarned > 0) {
        const { error: updateError } = await supabase.rpc('update_quiz_score', {
          attempt_id: attemptId,
          points_to_add: pointsEarned
        });

        if (updateError) throw updateError;
      }

      console.log('✅ Resposta salva:', { isCorrect, pointsEarned });
      return { isCorrect, pointsEarned };
    },
    onError: (error) => {
      console.error('❌ Erro ao responder pergunta:', error);
      toast.error('Erro ao salvar resposta');
    },
  });
}

// Interface para resultado do quiz
interface QuizResult {
  success: boolean;
  coins_earned: number;
  score: number;
  total_questions: number;
  passed: boolean;
}

// Hook para completar um quiz
export function useCompleteQuiz() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ attemptId }: { attemptId: string }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🎯 Completando quiz:', attemptId);

      const { data, error } = await supabase.rpc('complete_quiz', {
        attempt_id: attemptId,
        user_id: profile.id
      });

      if (error) throw error;

      console.log('✅ Quiz completado:', data);
      return data as unknown as QuizResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-attempts'] });
      
      if (result.passed) {
        toast.success(`Parabéns! Você ganhou ${result.coins_earned} moedas!`);
      } else {
        toast.error('Você precisava de pelo menos 70% de acertos para ganhar moedas.');
      }
    },
    onError: (error) => {
      console.error('❌ Erro ao completar quiz:', error);
      toast.error('Erro ao completar quiz');
    },
  });
}