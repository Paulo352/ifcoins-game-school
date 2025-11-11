import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface NewCardData {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary' | 'mythic';
  image_url: string | null;
  price: number;
  description: string | null;
  available: boolean;
  copies_available: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  creator?: {
    name: string;
    role: string;
  } | null;
}

export interface CreateCardData {
  name: string;
  rarity: 'common' | 'rare' | 'legendary' | 'mythic';
  image_url?: string;
  price: number;
  description?: string;
  available?: boolean;
  copies_available?: number;
}

export function useNewCards() {
  return useQuery({
    queryKey: ['new-cards'],
    queryFn: async () => {
      console.log('🃏 Fetching cards from database...');
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching cards:', error);
        throw error;
      }

      // Buscar informações do criador
      const cardsWithCreator = await Promise.all(
        (data || []).map(async (card) => {
          if (card.created_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, role')
              .eq('id', card.created_by)
              .single();
            
            return {
              ...card,
              creator: profile
            };
          }
          return {
            ...card,
            creator: null
          };
        })
      );

      console.log('✅ Cards fetched successfully:', cardsWithCreator?.length, 'cards');
      return cardsWithCreator as NewCardData[];
    },
  });
}

export function useAvailableCards() {
  return useQuery({
    queryKey: ['available-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('available', true)
        .or('is_special.is.null,is_special.eq.false')
        .order('name');

      if (error) throw error;
      return data as NewCardData[];
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardData: CreateCardData) => {
      console.log('🃏 Creating new card:', cardData);
      
      // Pegar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('cards')
        .insert([{
          name: cardData.name,
          rarity: cardData.rarity,
          image_url: cardData.image_url || null,
          price: cardData.price,
          description: cardData.description || null,
          available: cardData.available ?? true,
          copies_available: cardData.copies_available || null,
          created_by: user?.id || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating card:', error);
        throw error;
      }

      console.log('✅ Card created successfully:', data);
      return data as NewCardData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-cards'] });
      queryClient.invalidateQueries({ queryKey: ['available-cards'] });
      toast({
        title: "Carta criada!",
        description: "A nova carta foi adicionada ao sistema.",
      });
    },
    onError: (error) => {
      console.error('❌ Failed to create card:', error);
      toast({
        title: "Erro ao criar carta",
        description: "Não foi possível criar a carta. Tente novamente.",
        variant: "destructive"
      });
    }
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...cardData }: Partial<NewCardData> & { id: string }) => {
      console.log('🃏 Updating card:', id, cardData);
      
      const { data, error } = await supabase
        .from('cards')
        .update({
          name: cardData.name,
          rarity: cardData.rarity,
          image_url: cardData.image_url,
          price: cardData.price,
          description: cardData.description,
          available: cardData.available,
          copies_available: cardData.copies_available,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating card:', error);
        throw error;
      }

      console.log('✅ Card updated successfully:', data);
      return data as NewCardData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-cards'] });
      queryClient.invalidateQueries({ queryKey: ['available-cards'] });
      toast({
        title: "Carta atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('❌ Failed to update card:', error);
      toast({
        title: "Erro ao atualizar carta",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      console.log('🃏 Deleting card:', cardId);
      
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) {
        console.error('❌ Error deleting card:', error);
        throw error;
      }

      console.log('✅ Card deleted successfully');
      return cardId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-cards'] });
      queryClient.invalidateQueries({ queryKey: ['available-cards'] });
      toast({
        title: "Carta excluída!",
        description: "A carta foi removida do sistema.",
      });
    },
    onError: (error) => {
      console.error('❌ Failed to delete card:', error);
      toast({
        title: "Erro ao excluir carta",
        description: "Não foi possível excluir a carta. Tente novamente.",
        variant: "destructive"
      });
    }
  });
}