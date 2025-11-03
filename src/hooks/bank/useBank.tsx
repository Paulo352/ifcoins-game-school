import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BankData {
  id: string;
  total_coins: number;
  coins_in_circulation: number;
  created_at: string;
  updated_at: string;
}

export function useBank() {
  return useQuery({
    queryKey: ['bank'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as BankData;
    }
  });
}

export function useUpdateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ totalCoins }: { totalCoins: number }) => {
      const { error } = await supabase
        .from('bank')
        .update({ total_coins: totalCoins })
        .eq('id', (await supabase.from('bank').select('id').single()).data?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank'] });
      toast({
        title: 'Banco atualizado!',
        description: 'O saldo total do banco foi atualizado com sucesso.'
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o banco.',
        variant: 'destructive'
      });
    }
  });
}
