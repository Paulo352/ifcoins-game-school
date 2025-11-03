import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  amount: number;
  type: string;
  description: string | null;
  metadata: any;
  created_at: string;
  sender?: { name: string; email: string };
  receiver?: { name: string; email: string };
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          sender:profiles!transactions_sender_id_fkey(name, email),
          receiver:profiles!transactions_receiver_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Transaction[];
    }
  });
}

export function useUserTransactions(userId: string) {
  return useQuery({
    queryKey: ['user-transactions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          sender:profiles!transactions_sender_id_fkey(name, email),
          receiver:profiles!transactions_receiver_id_fkey(name, email)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Transaction[];
    }
  });
}
