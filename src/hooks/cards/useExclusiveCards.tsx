import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExclusiveCard {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary' | 'mythic';
  image_url?: string;
  description?: string;
  price: number;
  is_special: boolean;
  assigned_to?: string;
  created_at: string;
}

// Hook para buscar cartas exclusivas (apenas para admins)
export function useExclusiveCards() {
  return useQuery({
    queryKey: ['exclusive-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*, profiles!cards_assigned_to_fkey(name, email)')
        .eq('is_special', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    }
  });
}

// Hook para buscar cartas exclusivas do usuário
export function useMyExclusiveCards(userId: string | null) {
  return useQuery({
    queryKey: ['my-exclusive-cards', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          *,
          card:cards!inner(*)
        `)
        .eq('user_id', userId)
        .eq('card.is_special', true);

      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });
}

// Hook para criar carta exclusiva
export function useCreateExclusiveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: Omit<ExclusiveCard, 'id' | 'created_at' | 'is_special'> & { assigned_to: string }) => {
      const { data, error } = await supabase
        .from('cards')
        .insert([{
          ...card,
          is_special: true,
          available: false // Cartas exclusivas não ficam disponíveis na loja
        }])
        .select()
        .single();

      if (error) throw error;

      // Adicionar automaticamente à coleção do aluno
      const { error: userCardError } = await supabase
        .from('user_cards')
        .insert([{
          user_id: card.assigned_to,
          card_id: data.id,
          quantity: 1
        }]);

      if (userCardError) throw userCardError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusive-cards'] });
      toast.success('Carta exclusiva criada e atribuída com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar carta exclusiva:', error);
      toast.error('Erro ao criar carta exclusiva');
    }
  });
}

// Hook para deletar carta exclusiva
export function useDeleteExclusiveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      // Primeiro remover das coleções dos usuários
      const { error: userCardsError } = await supabase
        .from('user_cards')
        .delete()
        .eq('card_id', cardId);

      if (userCardsError) throw userCardsError;

      // Depois deletar a carta
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusive-cards'] });
      toast.success('Carta exclusiva deletada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar carta exclusiva:', error);
      toast.error('Erro ao deletar carta exclusiva');
    }
  });
}

// Hook para reatribuir carta exclusiva a outro aluno
export function useReassignExclusiveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, newStudentId }: { cardId: string; newStudentId: string }) => {
      // Buscar atribuição atual
      const { data: currentCard } = await supabase
        .from('cards')
        .select('assigned_to')
        .eq('id', cardId)
        .single();

      if (currentCard?.assigned_to) {
        // Remover da coleção do aluno anterior
        await supabase
          .from('user_cards')
          .delete()
          .eq('user_id', currentCard.assigned_to)
          .eq('card_id', cardId);
      }

      // Atualizar atribuição
      const { error: updateError } = await supabase
        .from('cards')
        .update({ assigned_to: newStudentId })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Adicionar à coleção do novo aluno
      const { error: insertError } = await supabase
        .from('user_cards')
        .insert([{
          user_id: newStudentId,
          card_id: cardId,
          quantity: 1
        }]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusive-cards'] });
      queryClient.invalidateQueries({ queryKey: ['my-exclusive-cards'] });
      toast.success('Carta reatribuída com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao reatribuir carta:', error);
      toast.error('Erro ao reatribuir carta');
    }
  });
}
