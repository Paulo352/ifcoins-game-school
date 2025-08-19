import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Card {
  id: string;
  name: string;
  description: string | null;
  rarity: 'common' | 'rare' | 'legendary' | 'mythic';
  price: number;
  available: boolean;
  copies_available: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  quantity: number;
  acquired_at: string;
  card: Card;
}

// Hook para buscar todas as cartas
export function useCards() {
  return useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('rarity', { ascending: false });
      
      if (error) throw error;
      return data as Card[];
    },
  });
}

// Hook para buscar cartas disponíveis na loja
export function useAvailableCards() {
  return useQuery({
    queryKey: ['available-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('available', true)
        .order('rarity', { ascending: false });
      
      if (error) throw error;
      return data as Card[];
    },
  });
}

// Hook para buscar cartas do usuário
export function useUserCards(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-cards', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          *,
          card:cards(*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as UserCard[];
    },
    enabled: !!userId,
  });
}

// Hook para criar carta
export function useCreateCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cardData: Omit<Card, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('cards')
        .insert([cardData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['available-cards'] });
      toast({
        title: "Carta criada!",
        description: "A carta foi criada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar carta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a carta.",
        variant: "destructive",
      });
    },
  });
}

// Hook para atualizar carta
export function useUpdateCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...cardData }: Partial<Card> & { id: string }) => {
      const { data, error } = await supabase
        .from('cards')
        .update(cardData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['available-cards'] });
      toast({
        title: "Carta atualizada!",
        description: "A carta foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar carta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a carta.",
        variant: "destructive",
      });
    },
  });
}

// Hook para deletar carta
export function useDeleteCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['available-cards'] });
      toast({
        title: "Carta removida!",
        description: "A carta foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao remover carta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a carta.",
        variant: "destructive",
      });
    },
  });
}