import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CreatePackData {
  name: string;
  price: number;
  limit_per_student: number;
  pack_type: 'random' | 'fixed';
  probability_common?: number;
  probability_rare?: number;
  probability_legendary?: number;
  probability_mythic?: number;
  probability_epic?: number;
  cards?: { card_id: string; quantity: number }[];
}

// Hook para criar pacote
export function useCreatePack() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (packData: CreatePackData) => {
      console.log('📦 Criando pacote:', packData);

      // Criar o pacote
      const { data: pack, error: packError } = await supabase
        .from('packs')
        .insert([{
          name: packData.name,
          price: packData.price,
          limit_per_student: packData.limit_per_student,
          pack_type: packData.pack_type,
          probability_common: packData.probability_common || 50,
          probability_rare: packData.probability_rare || 25,
          probability_legendary: packData.probability_legendary || 15,
          probability_mythic: packData.probability_mythic || 5,
          probability_epic: packData.probability_epic || 5,
        }])
        .select()
        .single();
      
      if (packError) throw packError;

      // Se é um pacote fixo e há cartas específicas, criar as associações
      if (packData.pack_type === 'fixed' && packData.cards && packData.cards.length > 0) {
        const packCards = packData.cards.map(card => ({
          pack_id: pack.id,
          card_id: card.card_id,
          quantity: card.quantity,
        }));

        const { error: cardsError } = await supabase
          .from('pack_cards')
          .insert(packCards);

        if (cardsError) {
          console.error('Erro ao adicionar cartas ao pacote:', cardsError);
          throw cardsError;
        }
      }
      
      console.log('✅ Pacote criado com sucesso:', pack);
      return pack;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['available-packs'] });
      toast({
        title: "Pacote criado!",
        description: "O pacote foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar pacote:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pacote.",
        variant: "destructive",
      });
    },
  });
}

// Hook para atualizar pacote
export function useUpdatePack() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, available, ...packData }: Partial<CreatePackData> & { id: string; available?: boolean }) => {
      const updateData: any = { ...packData };
      if (available !== undefined) updateData.available = available;
      
      const { data, error } = await supabase
        .from('packs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['available-packs'] });
      toast({
        title: "Pacote atualizado!",
        description: "O pacote foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar pacote:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pacote.",
        variant: "destructive",
      });
    },
  });
}

// Hook para deletar pacote
export function useDeletePack() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (packId: string) => {
      // Primeiro deletar as cartas do pacote (cascade irá cuidar disso automaticamente)
      const { error } = await supabase
        .from('packs')
        .delete()
        .eq('id', packId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['available-packs'] });
      toast({
        title: "Pacote removido!",
        description: "O pacote foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao remover pacote:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o pacote.",
        variant: "destructive",
      });
    },
  });
}