import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar role do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('classes')
        .select('*');

      // Se for professor (não admin), filtrar apenas turmas onde ele é responsável
      if (profile?.role === 'teacher') {
        query = query.or(`teacher_id.eq.${user.id},additional_teachers.cs.{${user.id}}`);
      }

      const { data: classesData, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar turmas:', error);
        throw error;
      }

      // Buscar informações dos professores e códigos de convite separadamente
      if (classesData && classesData.length > 0) {
        const teacherIds = [...new Set(classesData.map(c => c.teacher_id).filter(Boolean))];
        const creatorIds = [...new Set(classesData.map(c => c.created_by).filter(Boolean))];
        const allIds = [...new Set([...teacherIds, ...creatorIds])];

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', allIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Buscar códigos de convite ativos para cada turma
        const classIds = classesData.map(c => c.id);
        const { data: invitesData } = await supabase
          .from('class_invites')
          .select('class_id, invite_code')
          .in('class_id', classIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        const invitesMap = new Map(invitesData?.map(inv => [inv.class_id, inv.invite_code]) || []);

        const enrichedData = classesData.map(cls => {
          // Buscar dados dos professores adicionais
          const additionalTeachersData = cls.additional_teachers
            ? cls.additional_teachers.map((teacherId: string) => profilesMap.get(teacherId)).filter(Boolean)
            : [];

          return {
            ...cls,
            teacher: cls.teacher_id ? profilesMap.get(cls.teacher_id) : null,
            creator: cls.created_by ? profilesMap.get(cls.created_by) : null,
            additional_teachers_data: additionalTeachersData,
            invite_code: invitesMap.get(cls.id) || null
          };
        });

        return enrichedData;
      }

      return classesData || [];
    }
  });
}

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      console.log('📚 Buscando alunos da turma:', classId);
      
      const { data: classStudentsData, error } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', classId);
      
      if (error) {
        console.error('❌ Erro ao buscar alunos da turma:', error);
        throw error;
      }

      console.log('✅ Alunos encontrados:', classStudentsData);

      // Buscar informações dos alunos separadamente
      if (classStudentsData && classStudentsData.length > 0) {
        const studentIds = classStudentsData.map(cs => cs.student_id);
        
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('id, name, email, class')
          .in('id', studentIds);

        if (studentsError) {
          console.error('❌ Erro ao buscar perfis dos alunos:', studentsError);
          throw studentsError;
        }

        const studentsMap = new Map(studentsData?.map(s => [s.id, s]) || []);

        const enrichedData = classStudentsData.map(cs => ({
          ...cs,
          student: studentsMap.get(cs.student_id) || null
        }));

        console.log('✅ Dados enriquecidos:', enrichedData);
        return enrichedData;
      }

      return classStudentsData || [];
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

      // Criar convite automático para a turma
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error: inviteError } = await supabase
        .from('class_invites')
        .insert([{
          class_id: data.id,
          invite_code: inviteCode,
          created_by: user.id,
          is_active: true
        }]);

      if (inviteError) {
        console.error('⚠️ Erro ao criar convite:', inviteError);
      } else {
        console.log('✅ Convite criado:', inviteCode);
      }

      return { ...data, invite_code: inviteCode };
    },
    onSuccess: (data) => {
      console.log('🎉 Sucesso! Turma criada:', data);
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success(`Turma criada! Código de convite: ${data.invite_code}`);
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
