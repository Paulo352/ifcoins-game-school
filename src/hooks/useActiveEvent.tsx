import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types/supabase';

export function useActiveEvent() {
  const { data: activeEvent, isLoading } = useQuery({
    queryKey: ['active-event'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('bonus_multiplier', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data as Event | null;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const getMultiplier = () => {
    return activeEvent?.bonus_multiplier || 1;
  };

  const calculateBonusCoins = (baseCoins: number) => {
    const multiplier = getMultiplier();
    return Math.floor(baseCoins * multiplier);
  };

  return {
    activeEvent,
    isLoading,
    multiplier: getMultiplier(),
    calculateBonusCoins,
    hasActiveEvent: !!activeEvent,
  };
}