import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Trade {
  id: string;
  from_user_id: string;
  to_user_id: string;
  offered_cards: Record<string, number>;
  offered_coins: number;
  requested_cards: Record<string, number>;
  requested_coins: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateTradeData {
  to_user_id: string;
  offered_cards: Record<string, number>;
  offered_coins: number;
  requested_cards: Record<string, number>;
  requested_coins: number;
}

// Hook para buscar trades do usuário
export function useTrades() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['trades', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!user,
  });
}

// Hook para admins buscarem todas as trades
export function useAllTrades() {
  return useQuery({
    queryKey: ['all-trades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Trade[];
    },
  });
}

// Hook para criar trade
export function useCreateTrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (tradeData: CreateTradeData) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('trades')
        .insert([{
          ...tradeData,
          from_user_id: user.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: "Proposta enviada!",
        description: "Sua proposta de troca foi enviada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar trade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a proposta de troca.",
        variant: "destructive",
      });
    },
  });
}

// Hook para atualizar status do trade
export function useUpdateTradeStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tradeId, status }: { tradeId: string; status: 'accepted' | 'rejected' }) => {
      const { data, error } = await supabase
        .from('trades')
        .update({ status })
        .eq('id', tradeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: status === 'accepted' ? "Troca aceita!" : "Troca rejeitada",
        description: status === 'accepted' ? 
          "A proposta de troca foi aceita com sucesso." : 
          "A proposta de troca foi rejeitada.",
        variant: status === 'accepted' ? "default" : "destructive",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar status do trade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a troca.",
        variant: "destructive",
      });
    },
  });
}

// Hook para buscar estudantes (para seleção em trades)
export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'student')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook para buscar todas as cartas do sistema (para nomes nas trades)
export function useAllCardsNames() {
  return useQuery({
    queryKey: ['all-cards-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('id, name');
      
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });
}