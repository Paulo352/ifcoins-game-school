import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PurchaseResult {
  success: boolean;
  message: string;
}

export function useCardPurchase() {
  const [loading, setLoading] = useState<string | null>(null);

  const purchaseCard = async (userId: string, cardId: string): Promise<PurchaseResult> => {
    try {
      // Verificar saldo e dados da carta
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        return { success: false, message: 'Erro ao buscar dados do usuário' };
      }

      if (!userProfile) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      const { data: card, error: cardError } = await supabase
        .from('cards')
        .select('price, available, copies_available')
        .eq('id', cardId)
        .single();

      if (cardError) {
        console.error('Erro ao buscar carta:', cardError);
        return { success: false, message: 'Erro ao buscar dados da carta' };
      }

      if (!card) {
        return { success: false, message: 'Carta não encontrada' };
      }

      if (!card.available) {
        return { success: false, message: 'Carta não está disponível' };
      }

      if (card.copies_available !== null && card.copies_available <= 0) {
        return { success: false, message: 'Não há cópias disponíveis desta carta' };
      }

      if (userProfile.coins < card.price) {
        return { success: false, message: 'Saldo insuficiente' };
      }

      // Usar a função RPC do Supabase para compra atômica
      const { data: result, error: purchaseError } = await supabase.rpc('buy_card', {
        card_id: cardId,
        user_id: userId
      });

      if (purchaseError) {
        console.error('Erro na compra:', purchaseError);
        return { success: false, message: 'Erro interno na compra' };
      }

      if (result && typeof result === 'object' && 'success' in result && result.success) {
        return { success: true, message: 'Carta comprada com sucesso' };
      } else if (result && typeof result === 'object' && 'error' in result) {
        return { success: false, message: result.error as string || 'Erro desconhecido na compra' };
      } else {
        return { success: false, message: 'Erro desconhecido na compra' };
      }

    } catch (error) {
      console.error('Erro inesperado na compra:', error);
      return { success: false, message: 'Erro de conexão' };
    }
  };

  const buyCard = async (
    userId: string,
    cardId: string,
    cardName: string,
    onSuccess: () => void
  ) => {
    setLoading(cardId);

    try {
      const result = await purchaseCard(userId, cardId);

      if (result.success) {
        toast({
          title: "Carta comprada!",
          description: `Você adquiriu: ${cardName}`,
        });
        onSuccess();
      } else {
        toast({
          title: "Erro na compra",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao comprar carta:', error);
      toast({
        title: "Erro na compra",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return { buyCard, loading };
}