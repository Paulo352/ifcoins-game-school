import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useCardPurchase() {
  const [loading, setLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const buyCard = async (
    userId: string,
    cardId: string,
    cardName: string,
    onSuccess?: () => void
  ) => {
    if (loading) return;
    
    setLoading(cardId);

    try {
      // Verificar se a função RPC buy_card existe, se não, fazer compra manual
      const { data: result, error: rpcError } = await supabase.rpc('buy_card', {
        card_id: cardId,
        user_id: userId
      });

      if (rpcError) {
        // Se a função RPC não existir, fazer compra manual
        console.log('RPC buy_card não encontrada, fazendo compra manual');
        await manualCardPurchase(userId, cardId);
        
        toast({
          title: "Carta comprada!",
          description: `Você adquiriu: ${cardName}`,
        });
      } else {
        // Verificar resultado da RPC
        const rpcResult = result as any;
        if (rpcResult?.success) {
          toast({
            title: "Carta comprada!",
            description: `Você adquiriu: ${cardName}`,
          });
        } else {
          throw new Error(rpcResult?.error || 'Erro na compra');
        }
      }

      // Invalidar queries para atualizar dados
      await queryClient.invalidateQueries({ queryKey: ['available-cards'] });
      await queryClient.invalidateQueries({ queryKey: ['user-cards', userId] });
      await queryClient.invalidateQueries({ queryKey: ['cards'] });
      
      if (onSuccess) {
        await onSuccess();
      }

    } catch (error: any) {
      console.error('Erro na compra:', error);
      
      let errorMessage = 'Erro inesperado. Tente novamente.';
      
      if (error.message.includes('insufficient_funds')) {
        errorMessage = 'Saldo insuficiente para comprar esta carta.';
      } else if (error.message.includes('card_not_available')) {
        errorMessage = 'Esta carta não está mais disponível.';
      } else if (error.message.includes('out_of_stock')) {
        errorMessage = 'Carta esgotada.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro na compra",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const manualCardPurchase = async (userId: string, cardId: string) => {
    // Começar transação manual
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', userId)
      .single();

    if (userError) throw new Error('Erro ao buscar dados do usuário');
    
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('price, available, copies_available')
      .eq('id', cardId)
      .single();

    if (cardError) throw new Error('Erro ao buscar dados da carta');

    if (!card.available) {
      throw new Error('card_not_available');
    }

    if (card.copies_available !== null && card.copies_available <= 0) {
      throw new Error('out_of_stock');
    }

    if (user.coins < card.price) {
      throw new Error('insufficient_funds');
    }

    // Debitar moedas do usuário
    const { error: debitError } = await supabase
      .from('profiles')
      .update({ coins: user.coins - card.price })
      .eq('id', userId);

    if (debitError) throw debitError;

    // Adicionar carta ao usuário ou incrementar quantidade
    const { data: existingCard } = await supabase
      .from('user_cards')
      .select('quantity')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .single();

    if (existingCard) {
      // Incrementar quantidade se já possui a carta
      const { error: updateError } = await supabase
        .from('user_cards')
        .update({ quantity: existingCard.quantity + 1 })
        .eq('user_id', userId)
        .eq('card_id', cardId);

      if (updateError) throw updateError;
    } else {
      // Criar novo registro se não possui a carta
      const { error: insertError } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          card_id: cardId,
          quantity: 1
        });

      if (insertError) throw insertError;
    }

    // Decrementar copies_available se aplicável
    if (card.copies_available !== null) {
      const { error: updateCardError } = await supabase
        .from('cards')
        .update({ copies_available: card.copies_available - 1 })
        .eq('id', cardId);

      if (updateCardError) throw updateCardError;
    }
  };

  return { buyCard, loading };
}