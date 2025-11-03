import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface MarketListing {
  id: string;
  seller_id: string;
  card_id: string;
  price: number;
  status: 'active' | 'sold' | 'expired' | 'removed';
  expires_at: string;
  sold_to: string | null;
  sold_at: string | null;
  created_at: string;
  seller?: { name: string; email: string };
  card?: {
    id: string;
    name: string;
    rarity: string;
    image_url: string | null;
    price: number;
  };
}

export function useMarketListings(filters?: {
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['market-listings', filters],
    queryFn: async () => {
      let query = supabase
        .from('market_listings')
        .select(`
          *,
          seller:profiles!market_listings_seller_id_fkey(name, email),
          card:cards(id, name, rarity, image_url, price)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      let results = data as MarketListing[];

      if (filters?.rarity) {
        results = results.filter(item => item.card?.rarity === filters.rarity);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(item => 
          item.card?.name.toLowerCase().includes(searchLower)
        );
      }

      return results;
    }
  });
}

export function useMyListings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('market_listings')
        .select(`
          *,
          card:cards(id, name, rarity, image_url, price)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketListing[];
    },
    enabled: !!user
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ cardId, price }: { cardId: string; price: number }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se o usuário tem a carta
      const { data: userCard, error: checkError } = await supabase
        .from('user_cards')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .single();

      if (checkError || !userCard || userCard.quantity < 1) {
        throw new Error('Você não possui esta carta');
      }

      const { error } = await supabase
        .from('market_listings')
        .insert({
          seller_id: user.id,
          card_id: cardId,
          price
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast({
        title: 'Anúncio criado!',
        description: 'Sua carta está disponível no IFMarket.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o anúncio.',
        variant: 'destructive'
      });
    }
  });
}

export function useBuyMarketItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ listingId }: { listingId: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('buy_market_item', {
        listing_id: listingId,
        buyer_id: user.id
      });
      
      if (error) throw error;
      
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-listings'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['bank'] });
      toast({
        title: 'Compra realizada!',
        description: 'A carta foi adicionada à sua coleção.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível completar a compra.',
        variant: 'destructive'
      });
    }
  });
}

export function useCancelListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId }: { listingId: string }) => {
      const { error } = await supabase
        .from('market_listings')
        .update({ status: 'removed' })
        .eq('id', listingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast({
        title: 'Anúncio removido',
        description: 'Seu anúncio foi removido do marketplace.'
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o anúncio.',
        variant: 'destructive'
      });
    }
  });
}
