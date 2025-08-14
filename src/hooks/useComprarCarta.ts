import { supabase } from '@/integrations/supabase/client';

interface ResultadoCompra {
  sucesso: boolean;
  mensagem: string;
}

export async function comprarCarta(userId: string, cartaId: string): Promise<ResultadoCompra> {
  try {
    // Buscar saldo atual do usuário na tabela profiles (adaptação: usuarios -> profiles, saldo -> coins)
    const { data: usuario, error: usuarioError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', userId)
      .single();

    if (usuarioError) {
      console.error('Erro ao buscar usuário:', usuarioError);
      return { sucesso: false, mensagem: 'Erro ao buscar dados do usuário' };
    }

    if (!usuario) {
      return { sucesso: false, mensagem: 'Usuário não encontrado' };
    }

    // Buscar preço da carta na tabela cards (adaptação: cartas -> cards, preco -> price)
    const { data: carta, error: cartaError } = await supabase
      .from('cards')
      .select('price, available, copies_available')
      .eq('id', cartaId)
      .single();

    if (cartaError) {
      console.error('Erro ao buscar carta:', cartaError);
      return { sucesso: false, mensagem: 'Erro ao buscar dados da carta' };
    }

    if (!carta) {
      return { sucesso: false, mensagem: 'Carta não encontrada' };
    }

    if (!carta.available) {
      return { sucesso: false, mensagem: 'Carta não está disponível' };
    }

    if (carta.copies_available !== null && carta.copies_available <= 0) {
      return { sucesso: false, mensagem: 'Não há cópias disponíveis desta carta' };
    }

    // Verificar se saldo é suficiente
    if (usuario.coins < carta.price) {
      return { sucesso: false, mensagem: 'Saldo insuficiente' };
    }

    // Usar a função RPC do Supabase para compra atômica
    const { data: resultado, error: compraError } = await supabase.rpc('buy_card', {
      card_id: cartaId,
      user_id: userId
    });

    if (compraError) {
      console.error('Erro na compra:', compraError);
      return { sucesso: false, mensagem: 'Erro interno na compra' };
    }

    if (resultado && typeof resultado === 'object' && 'success' in resultado && resultado.success) {
      return { sucesso: true, mensagem: 'Carta comprada com sucesso' };
    } else if (resultado && typeof resultado === 'object' && 'error' in resultado) {
      return { sucesso: false, mensagem: resultado.error as string || 'Erro desconhecido na compra' };
    } else {
      return { sucesso: false, mensagem: 'Erro desconhecido na compra' };
    }

  } catch (error) {
    console.error('Erro inesperado na compra:', error);
    return { sucesso: false, mensagem: 'Erro de conexão' };
  }
}

// Hook para usar no React
export function useComprarCarta() {
  return { comprarCarta };
}