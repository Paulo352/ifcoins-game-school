
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
      console.log('Tentando comprar carta:', { userId, cardId, cardName });

      // Tentar usar a função RPC buy_card
      const { data: result, error: rpcError } = await supabase.rpc('buy_card', {
        card_id: cardId,
        user_id: userId
      });

      if (rpcError) {
        console.log('RPC buy_card falhou, fazendo compra manual:', rpcError);
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
      
      if (error.message.includes('insufficient_funds') || error.message.includes('insuficiente')) {
        errorMessage = 'Saldo insuficiente para comprar esta carta.';
      } else if (error.message.includes('card_not_available') || error.message.includes('não está disponível')) {
        errorMessage = 'Esta carta não está mais disponível.';
      } else if (error.message.includes('out_of_stock') || error.message.includes('cópias disponíveis')) {
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
    console.log('Executando compra manual...');
    
    // Buscar dados do usuário com alias explícito
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      throw new Error('Erro ao buscar dados do usuário');
    }
    
    // Buscar dados da carta com alias explícito
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('price, available, copies_available')
      .eq('id', cardId)
      .single();

    if (cardError) {
      console.error('Erro ao buscar carta:', cardError);
      throw new Error('Erro ao buscar dados da carta');
    }

    console.log('Dados obtidos:', { user, card });

    // Validações
    if (!card.available) {
      throw new Error('Esta carta não está disponível para compra');
    }

    if (card.copies_available !== null && card.copies_available <= 0) {
      throw new Error('Esta carta está esgotada');
    }

    if (user.coins < card.price) {
      throw new Error('Saldo insuficiente para comprar esta carta');
    }

    // Debitar moedas do usuário
    const { error: debitError } = await supabase
      .from('profiles')
      .update({ coins: user.coins - card.price })
      .eq('id', userId);

    if (debitError) {
      console.error('Erro ao debitar moedas:', debitError);
      throw new Error('Erro ao processar pagamento');
    }

    // Verificar se já possui a carta
    const { data: existingCard } = await supabase
      .from('user_cards')
      .select('quantity')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .maybeSingle();

    if (existingCard) {
      // Incrementar quantidade se já possui a carta
      const { error: updateError } = await supabase
        .from('user_cards')
        .update({ quantity: existingCard.quantity + 1 })
        .eq('user_id', userId)
        .eq('card_id', cardId);

      if (updateError) {
        console.error('Erro ao atualizar quantidade:', updateError);
        throw new Error('Erro ao adicionar carta à coleção');
      }
    } else {
      // Criar novo registro se não possui a carta
      const { error: insertError } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          card_id: cardId,
          quantity: 1
        });

      if (insertError) {
        console.error('Erro ao inserir carta:', insertError);
        throw new Error('Erro ao adicionar carta à coleção');
      }
    }

    // Decrementar copies_available se aplicável
    if (card.copies_available !== null) {
      const { error: updateCardError } = await supabase
        .from('cards')
        .update({ copies_available: Math.max(card.copies_available - 1, 0) })
        .eq('id', cardId);

      if (updateCardError) {
        console.error('Erro ao atualizar estoque:', updateCardError);
        // Não falhar aqui, pois a compra já foi processada
      }
    }

    console.log('Compra manual concluída com sucesso');
  };

  return { buyCard, loading };
}
