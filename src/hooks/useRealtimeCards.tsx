import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para atualizar cartas em tempo real
 * Escuta mudanças nas tabelas user_cards e cards
 */
export function useRealtimeCards() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Escutar mudanças em user_cards
    const userCardsChannel = supabase
      .channel('user-cards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_cards',
        },
        (payload) => {
          console.log('📡 Cartas do usuário atualizadas:', payload);
          
          // Invalidar queries de cartas do usuário
          queryClient.invalidateQueries({ queryKey: ['user-cards', user.id] });
          queryClient.invalidateQueries({ queryKey: ['collection'] });
          
          // Se a mudança afeta o usuário atual, atualizar perfil também
          const newUserId = (payload.new as any)?.user_id;
          const oldUserId = (payload.old as any)?.user_id;
          if (newUserId === user.id || oldUserId === user.id) {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
          }
        }
      )
      .subscribe();

    // Escutar mudanças em cards (disponibilidade, estoque)
    const cardsChannel = supabase
      .channel('cards-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cards',
        },
        (payload) => {
          console.log('📡 Cartas atualizadas:', payload);
          
          // Invalidar queries de cartas disponíveis
          queryClient.invalidateQueries({ queryKey: ['available-cards'] });
          queryClient.invalidateQueries({ queryKey: ['cards'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userCardsChannel);
      supabase.removeChannel(cardsChannel);
    };
  }, [queryClient, user]);
}
