import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para atualização em tempo real dos eventos
 */
export function useRealtimeEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('events-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          console.log('🔄 Eventos atualizados:', payload);
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
