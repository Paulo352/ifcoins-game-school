import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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