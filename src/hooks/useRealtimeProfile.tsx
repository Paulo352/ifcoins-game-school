import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para atualizar o perfil do usuário em tempo real
 * Escuta mudanças na tabela profiles e atualiza automaticamente
 */
export function useRealtimeProfile() {
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('📡 Perfil atualizado:', payload);
          // Atualizar perfil quando houver mudanças
          refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshProfile]);
}
