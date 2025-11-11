import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useExclusiveCardHistory(userId?: string) {
  return useQuery({
    queryKey: ['exclusive-card-history', userId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('exclusive_card_history')
        .select(`
          *,
          card:cards(*),
          granted_by_profile:profiles!exclusive_card_history_granted_by_fkey(name, email)
        `)
        .order('granted_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}
