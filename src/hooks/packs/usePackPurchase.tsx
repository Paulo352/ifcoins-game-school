import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PackPurchaseResult {
  success: boolean;
  message?: string;
  error?: string;
  cards_received?: {
    card_id: string;
    name: string;
    rarity: string;
    quantity: number;
  }[];
}

// Hook para comprar pacote
export function useBuyPack() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ packId, userId }: { packId: string; userId: string }): Promise<PackPurchaseResult> => {
      console.log('🛒 Iniciando compra de pacote:', { packId, userId });

      try {
        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 Usuário autenticado:', user?.id);
        
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        // Usar a função do banco de dados para comprar o pacote
        const { data, error } = await supabase.rpc('buy_pack', {
          pack_id: packId,
          user_id: userId
        });

        console.log('📦 Resposta do RPC buy_pack:', { data, error });

        if (error) {
          console.error('❌ Erro na compra do pacote:', error);
          throw new Error(error.message || 'Erro ao comprar pacote');
        }

        if (!data) {
          console.error('❌ Resposta vazia do servidor');
          throw new Error('Resposta vazia do servidor');
        }

        console.log('✅ Resposta da compra:', data);
        
        const result = data as unknown as PackPurchaseResult;
        
        if (!result.success) {
          throw new Error(result.error || 'Erro na compra');
        }

        return result;
      } catch (err: any) {
        console.error('❌ Exceção capturada:', err);
        throw err;
      }
    },
    onSuccess: (data: PackPurchaseResult) => {
      console.log('✅ Compra concluída com sucesso:', data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['available-packs'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['pack-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      
      toast({
        title: "🎉 Pacote comprado!",
        description: data.message || 'Pacote comprado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro na compra:', error);
      toast({
        title: "Erro na compra",
        description: error.message || 'Erro ao comprar pacote',
        variant: "destructive",
      });
    },
  });
}