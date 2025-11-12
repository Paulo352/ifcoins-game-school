import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('classes')
        .select('*, profiles!classes_created_by_fkey(name), teacher:profiles!classes_teacher_id_fkey(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('class_students')
        .select('*, student:profiles!class_students_student_id_fkey(id, name, email, class)')
        .eq('class_id', classId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!classId
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (classData: { 
      name: string; 
      description?: string; 
      teacher_id?: string;
      additional_teachers?: string[];
    }) => {
      console.log('📝 Criando turma:', classData);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ Erro ao obter usuário:', userError);
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 Usuário autenticado:', user.id);
      
      const insertData = { 
        name: classData.name,
        description: classData.description,
        teacher_id: classData.teacher_id,
        additional_teachers: classData.additional_teachers || [],
        created_by: user.id
      };

      console.log('📤 Dados para inserir:', insertData);
      
      const { data, error } = await (supabase as any)
        .from('classes')
        .insert([insertData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar turma:', error);
        throw error;
      }

      console.log('✅ Turma criada com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Sucesso! Turma criada:', data);
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutação:', error);
      toast.error(`Erro ao criar turma: ${error.message || 'Erro desconhecido'}`);
    }
  });
}

export function useAddStudentToClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      const { data, error } = await (supabase as any)
        .from('class_students')
        .insert([{ 
          class_id: classId, 
          student_id: studentId,
          added_by: (await supabase.auth.getUser()).data.user?.id 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-students', variables.classId] });
      toast.success('Aluno adicionado à turma!');
    },
    onError: () => {
      toast.error('Erro ao adicionar aluno');
    }
  });
}

export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      const { error } = await (supabase as any)
        .from('class_students')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-students', variables.classId] });
      toast.success('Aluno removido da turma!');
    },
    onError: () => {
      toast.error('Erro ao remover aluno');
    }
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await (supabase as any)
        .from('classes')
        .delete()
        .eq('id', classId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma deletada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao deletar turma');
    }
  });
}
