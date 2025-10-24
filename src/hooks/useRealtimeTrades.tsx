import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para atualizar trocas em tempo real
 * Escuta mudanças na tabela trades
 */
export function useRealtimeTrades() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('trade-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
        },
        (payload) => {
          console.log('📡 Troca atualizada:', payload);
          
          // Invalidar queries de trocas
          queryClient.invalidateQueries({ queryKey: ['trades'] });
          queryClient.invalidateQueries({ queryKey: ['all-trades'] });
          
          // Se a troca foi aceita, atualizar perfil e cartas do usuário
          if (payload.new && (payload.new as any).status === 'accepted') {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user-cards', user.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);
}
