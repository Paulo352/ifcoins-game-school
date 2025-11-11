import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePowerUps() {
  return useQuery({
    queryKey: ['power-ups'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('power_ups')
        .select('*')
        .eq('is_active', true)
        .order('cost_coins');
      
      if (error) throw error;
      return data;
    }
  });
}

export function usePowerUpUsage(roomId: string) {
  return useQuery({
    queryKey: ['power-up-usage', roomId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await (supabase as any)
        .from('power_up_usage')
        .select('*, power_up:power_ups(*)')
        .eq('room_id', roomId)
        .eq('user_id', userData.user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!roomId
  });
}

export function useUsePowerUp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      roomId,
      powerUpId,
      questionId,
      costCoins
    }: {
      roomId: string;
      powerUpId: string;
      questionId: string;
      costCoins: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      // Check if user has enough coins
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single();
      
      if (!profile || profile.coins < costCoins) {
        throw new Error('Moedas insuficientes');
      }
      
      // Deduct coins
      await supabase
        .from('profiles')
        .update({ coins: profile.coins - costCoins })
        .eq('id', userId);
      
      // Register usage
      const { error } = await (supabase as any)
        .from('power_up_usage')
        .insert([{ 
          room_id: roomId, 
          user_id: userId, 
          power_up_id: powerUpId, 
          question_id: questionId 
        }]);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['power-up-usage', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Power-up usado!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}
