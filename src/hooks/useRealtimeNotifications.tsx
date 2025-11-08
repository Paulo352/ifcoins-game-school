import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useRealtimeNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen to loan status changes
    const loansChannel = supabase
      .channel('loan-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loans',
          filter: `student_id=eq.${user.id}`
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          
          if (newStatus !== oldStatus) {
            if (newStatus === 'approved') {
              toast.success('✅ Empréstimo aprovado!', {
                description: 'Seu empréstimo foi aprovado e as moedas foram creditadas.'
              });
            } else if (newStatus === 'denied') {
              toast.error('❌ Empréstimo negado', {
                description: 'Seu empréstimo foi recusado. Entre em contato com um admin.'
              });
            }
          }
          
          // Check for counter proposals
          if (payload.new.counter_status === 'pending' && payload.old.counter_status !== 'pending') {
            toast.info('🔄 Nova contraproposta!', {
              description: 'O admin enviou uma contraproposta para seu empréstimo.'
            });
          }
        }
      )
      .subscribe();

    // Listen to rewards
    const rewardsChannel = supabase
      .channel('reward-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reward_logs',
          filter: `student_id=eq.${user.id}`
        },
        (payload) => {
          const coins = payload.new.coins;
          const reason = payload.new.reason;
          
          toast.success(`💰 +${coins} IFCoins recebidos!`, {
            description: reason || 'Você recebeu moedas!'
          });
        }
      )
      .subscribe();

    // Listen to card assignments
    const cardsChannel = supabase
      .channel('card-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_cards',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          // Fetch card details
          const { data: card } = await supabase
            .from('cards')
            .select('name, rarity')
            .eq('id', payload.new.card_id)
            .single();
          
          if (card) {
            toast.success(`🎴 Nova carta obtida!`, {
              description: `Você recebeu: ${card.name} (${card.rarity})`
            });
          }
        }
      )
      .subscribe();

    return () => {
      loansChannel.unsubscribe();
      rewardsChannel.unsubscribe();
      cardsChannel.unsubscribe();
    };
  }, [user]);
}
