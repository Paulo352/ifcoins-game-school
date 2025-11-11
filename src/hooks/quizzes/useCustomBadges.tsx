import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserCustomBadge {
  id: string;
  badge_id: string;
  user_id: string;
  awarded_by: string;
  reason: string | null;
  awarded_at: string;
  custom_badges?: CustomBadge;
  profiles?: {
    name: string;
    email: string;
  };
}

export function useCustomBadges() {
  return useQuery({
    queryKey: ['custom-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomBadge[];
    }
  });
}

export function useUserCustomBadges(userId: string | null) {
  return useQuery({
    queryKey: ['user-custom-badges', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_custom_badges')
        .select('*, custom_badges(*)')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      return data as any;
    },
    enabled: !!userId
  });
}

export function useCreateCustomBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badge: Omit<CustomBadge, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('custom_badges')
        .insert([badge as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-badges'] });
      toast.success('Badge criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar badge:', error);
      toast.error('Erro ao criar badge');
    }
  });
}

export function useUpdateCustomBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      badgeId, 
      updates 
    }: { 
      badgeId: string; 
      updates: Partial<CustomBadge>;
    }) => {
      const { data, error } = await supabase
        .from('custom_badges')
        .update(updates)
        .eq('id', badgeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-badges'] });
      toast.success('Badge atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar badge:', error);
      toast.error('Erro ao atualizar badge');
    }
  });
}

export function useDeleteCustomBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await supabase
        .from('custom_badges')
        .delete()
        .eq('id', badgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-badges'] });
      toast.success('Badge deletada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar badge:', error);
      toast.error('Erro ao deletar badge');
    }
  });
}

export function useAwardBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      badgeId,
      userId,
      reason
    }: {
      badgeId: string;
      userId: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('user_custom_badges')
        .insert([{
          badge_id: badgeId,
          user_id: userId,
          reason
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-custom-badges'] });
      toast.success('Badge atribuída com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atribuir badge:', error);
      if (error.code === '23505') {
        toast.error('Este aluno já possui esta badge');
      } else {
        toast.error('Erro ao atribuir badge');
      }
    }
  });
}

export function useRevokeBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userBadgeId: string) => {
      const { error } = await supabase
        .from('user_custom_badges')
        .delete()
        .eq('id', userBadgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-custom-badges'] });
      toast.success('Badge removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover badge:', error);
      toast.error('Erro ao remover badge');
    }
  });
}
