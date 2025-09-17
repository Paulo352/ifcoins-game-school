import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Pack {
  id: string;
  name: string;
  available: boolean;
  limit_per_student: number;
  price: number;
  probability_common: number;
  probability_rare: number;
  probability_legendary: number;
  probability_mythic: number;
  pack_type: 'random' | 'fixed';
  created_at: string;
  updated_at: string;
}

export interface PackCard {
  id: string;
  pack_id: string;
  card_id: string;
  quantity: number;
  card?: {
    id: string;
    name: string;
    rarity: string;
    image_url: string | null;
  };
}

export interface CreatePackData {
  name: string;
  price: number;
  limit_per_student: number;
  pack_type: 'random' | 'fixed';
  probability_common?: number;
  probability_rare?: number;
  probability_legendary?: number;
  probability_mythic?: number;
  cards?: { card_id: string; quantity: number }[];
}

// Hook para buscar todos os pacotes
export function usePacks() {
  return useQuery({
    queryKey: ['packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Pack[];
    },
  });
}

// Hook para buscar pacotes disponíveis
export function useAvailablePacks() {
  return useQuery({
    queryKey: ['available-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packs')
        .select('*')
        .eq('available', true)
        .order('name');
      
      if (error) throw error;
      return data as Pack[];
    },
  });
}

// Hook para buscar cartas de um pacote fixo
export function usePackCards(packId: string | undefined) {
  return useQuery({
    queryKey: ['pack-cards', packId],
    queryFn: async () => {
      if (!packId) return [];
      
      const { data, error } = await supabase
        .from('pack_cards')
        .select(`
          *,
          card:cards (
            id,
            name,
            rarity,
            image_url
          )
        `)
        .eq('pack_id', packId);
      
      if (error) throw error;
      return data as PackCard[];
    },
    enabled: !!packId,
  });
}

// Hook para comprar pacote
export function useBuyPack() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ packId, userId }: { packId: string; userId: string }) => {
      console.log('🛒 Iniciando compra de pacote:', { packId, userId });

      // Usar a função do banco de dados para comprar o pacote
      const { data, error } = await supabase.rpc('buy_pack', {
        pack_id: packId,
        user_id: userId
      });

      if (error) {
        console.error('❌ Erro na compra do pacote:', error);
        throw error;
      }

      console.log('✅ Resposta da compra:', data);
      
      const result = data as any;
      
      if (!result.success) {
        throw new Error(result.error || 'Erro na compra');
      }

      return result;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['available-packs'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      
      toast({
        title: "Pacote comprado!",
        description: data.message || 'Pacote comprado com sucesso!',
      });
      
      // Mostrar cartas recebidas se disponível
      if (data.cards_received && data.cards_received.length > 0) {
        const cardsText = data.cards_received.map((card: any) => 
          `${card.name} (${card.rarity}) x${card.quantity}`
        ).join(', ');
        toast({
          title: "Cartas recebidas!",
          description: cardsText,
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ Erro na compra:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro ao comprar pacote',
        variant: "destructive",
      });
    },
  });
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
          probability_common: packData.probability_common || 60,
          probability_rare: packData.probability_rare || 25,
          probability_legendary: packData.probability_legendary || 10,
          probability_mythic: packData.probability_mythic || 5,
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

// Hook para buscar histórico de compras de pacotes do usuário
export function usePackPurchases(userId: string | undefined) {
  return useQuery({
    queryKey: ['pack-purchases', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('pack_purchases')
        .select(`
          *,
          pack:packs (
            id,
            name,
            pack_type
          )
        `)
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
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