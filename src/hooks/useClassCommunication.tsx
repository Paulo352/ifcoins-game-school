import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useClassMessages(classId: string | undefined) {
  return useQuery({
    queryKey: ['class-messages', classId],
    queryFn: async () => {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from('class_messages')
        .select(`
          *,
          sender:profiles!class_messages_sender_id_fkey(name, role)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ classId, message }: { classId: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      
      const { error } = await supabase
        .from('class_messages')
        .insert({
          class_id: classId,
          sender_id: user.id,
          message,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-messages'] });
      toast.success('Mensagem enviada!');
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    },
  });
}

export function useClassInvites(classId: string | undefined) {
  return useQuery({
    queryKey: ['class-invites', classId],
    queryFn: async () => {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from('class_invites')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      classId, 
      expiresAt, 
      maxUses 
    }: { 
      classId: string; 
      expiresAt?: string; 
      maxUses?: number 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      
      // Gerar código único
      const { data: code, error: codeError } = await supabase
        .rpc('generate_invite_code');
      
      if (codeError) throw codeError;
      
      const { error } = await supabase
        .from('class_invites')
        .insert({
          class_id: classId,
          invite_code: code,
          created_by: user.id,
          expires_at: expiresAt || null,
          max_uses: maxUses || null,
        });
      
      if (error) throw error;
      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-invites'] });
      toast.success('Convite criado!');
    },
    onError: () => {
      toast.error('Erro ao criar convite');
    },
  });
}

export function useJoinClassByInvite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      
      // Buscar convite
      const { data: invite, error: inviteError } = await supabase
        .from('class_invites')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (inviteError) throw new Error('Código de convite inválido');
      
      // Verificar se expirou
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new Error('Código de convite expirado');
      }
      
      // Verificar limite de usos
      if (invite.max_uses && invite.uses_count >= invite.max_uses) {
        throw new Error('Código de convite atingiu o limite de usos');
      }
      
      // Adicionar aluno à turma
      const { error: addError } = await supabase
        .from('class_students')
        .insert({
          class_id: invite.class_id,
          student_id: user.id,
          added_by: invite.created_by,
        });
      
      if (addError) {
        if (addError.code === '23505') {
          throw new Error('Você já está nesta turma');
        }
        throw addError;
      }
      
      // Incrementar contador de usos
      await supabase
        .from('class_invites')
        .update({ uses_count: invite.uses_count + 1 })
        .eq('id', invite.id);
      
      return invite.class_id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students'] });
      toast.success('Você entrou na turma!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeactivateInvite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('class_invites')
        .update({ is_active: false })
        .eq('id', inviteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-invites'] });
      toast.success('Convite desativado');
    },
    onError: () => {
      toast.error('Erro ao desativar convite');
    },
  });
}
