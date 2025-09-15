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
      
      // Temporarily return empty until migration is applied
      return [];
    },
    enabled: !!packId,
  });
}

// Hook para comprar pacote
export function useBuyPack() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ packId, userId }: { packId: string; userId: string }) => {
      // Temporarily return success until migration is applied
      return { success: true, message: "Funcionalidade será ativada após migração" };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      toast({
        title: "Aviso",
        description: "Funcionalidade será ativada após aprovação da migração do banco.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Erro ao comprar pacote:', error);
      toast({
        title: "Erro",
        description: "Não foi possível comprar o pacote.",
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

      // Se for pacote fixo, adicionar as cartas (após migração)
      if (packData.pack_type === 'fixed' && packData.cards?.length) {
        // Temporarily skip pack cards insertion until migration is applied
        console.log('Pack cards will be inserted after migration');
      }
      
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
      // Primeiro deletar as cartas do pacote (após migração)
      // Temporarily skip pack cards deletion until migration is applied

      // Depois deletar o pacote
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