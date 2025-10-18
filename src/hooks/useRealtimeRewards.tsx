import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para atualizar recompensas em tempo real
 * Escuta mudanças na tabela reward_logs para atualizar estatísticas de professores
 */
export function useRealtimeRewards() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('reward-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reward_logs',
        },
        (payload) => {
          console.log('📡 Nova recompensa registrada:', payload);
          
          // Invalidar queries relacionadas a recompensas
          queryClient.invalidateQueries({ queryKey: ['teacher-stats'] });
          queryClient.invalidateQueries({ queryKey: ['teacher-recent-rewards'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
          queryClient.invalidateQueries({ queryKey: ['reward-logs'] });
          
          // Se o usuário atual é o professor que deu a recompensa, atualizar limite diário
          if (payload.new.teacher_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['teacher-daily-limit'] });
          }
          
          // Se o usuário atual é o estudante que recebeu, atualizar perfil
          if (payload.new.student_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);
}
