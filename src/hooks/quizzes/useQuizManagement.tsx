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
  class_id: string | null;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  class_ids?: string[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[] | null;
  points: number;
  question_order: number;
}

export interface CreateQuizData {
  title: string;
  description?: string;
  reward_type: 'coins' | 'card';
  reward_coins: number;
  reward_card_id?: string;
  class_ids?: string[];
  max_attempts?: number;
  time_limit_minutes?: number;
  questions: Array<{
    question_text: string;
    question_type: 'multiple_choice' | 'true_false';
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user?.id || '')
        .single();
      
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!quizzes || quizzes.length === 0) return [];
      
      // Buscar turmas associadas a cada quiz
      const quizIds = quizzes.map(q => q.id);
      const { data: quizClasses } = await supabase
        .from('quiz_classes')
        .select('quiz_id, class_id')
        .in('quiz_id', quizIds);
      
      // Mapear turmas por quiz
      const quizClassesMap = new Map<string, string[]>();
      quizClasses?.forEach(qc => {
        const existing = quizClassesMap.get(qc.quiz_id) || [];
        quizClassesMap.set(qc.quiz_id, [...existing, qc.class_id]);
      });
      
      // Se for estudante, filtrar quizzes por turmas matriculadas
      let filteredQuizzes = quizzes;
      if (profile?.role === 'student' && user?.id) {
        const { data: enrollments } = await supabase
          .from('class_students')
          .select('class_id')
          .eq('student_id', user.id);
        
        const enrolledClassIds = enrollments?.map(e => e.class_id) || [];
        
        // Filtrar quizzes: mostrar se não tem turma ou se alguma turma do quiz está nas matrículas
        filteredQuizzes = quizzes.filter(quiz => {
          const quizClassIds = quizClassesMap.get(quiz.id) || [];
          // Se não tem turmas associadas, mostrar para todos
          if (quizClassIds.length === 0 && !quiz.class_id) return true;
          // Se tem class_id legado, verificar
          if (quiz.class_id && enrolledClassIds.includes(quiz.class_id)) return true;
          // Se tem turmas na nova tabela, verificar se alguma bate
          return quizClassIds.some(classId => enrolledClassIds.includes(classId));
        });
      }
      
      // Buscar informações dos criadores
      const creatorIds = [...new Set(filteredQuizzes.map(q => q.created_by))];
      const { data: creators, error: creatorsError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('id', creatorIds);
      
      if (creatorsError) throw creatorsError;
      
      const creatorsMap = new Map(creators?.map(c => [c.id, c]) || []);
      
      const transformedData = filteredQuizzes.map((quiz) => ({
        ...quiz,
        class_ids: quizClassesMap.get(quiz.id) || [],
        creator: creatorsMap.get(quiz.created_by) || null
      }));
      
      return transformedData as (Quiz & { creator?: { name: string; role: string } | null })[];
    },
  });
}

// Hook para buscar perguntas de um quiz (SEM respostas corretas)
export function useQuizQuestions(quizId: string) {
  return useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, quiz_id, question_text, question_type, options, points, question_order')
        .eq('quiz_id', quizId)
        .order('question_order');
      
      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: !!quizId
  });
}

// Hook para criar quiz
export function useCreateQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quizData: CreateQuizData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Criar quiz (sem class_id, agora usamos quiz_classes)
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
      
      // Criar associações com turmas
      if (quizData.class_ids && quizData.class_ids.length > 0) {
        const quizClassesInserts = quizData.class_ids.map(classId => ({
          quiz_id: quiz.id,
          class_id: classId
        }));
        
        const { error: classesError } = await supabase
          .from('quiz_classes')
          .insert(quizClassesInserts);
        
        if (classesError) throw classesError;
      }
      
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
      // quiz_classes será deletado automaticamente por CASCADE
      
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