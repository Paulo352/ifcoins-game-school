-- Fix internal error in buy_card caused by ON CONFLICT without unique constraint
-- Implement safe upsert (update then insert) and handle NULL copies correctly
CREATE OR REPLACE FUNCTION public.buy_card(card_id uuid, user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  card_price integer;
  user_coins integer;
  card_available boolean;
  current_copies integer;
BEGIN
  -- Buscar carta
  SELECT price, available, copies_available
  INTO card_price, card_available, current_copies
  FROM cards WHERE id = card_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Carta não encontrada');
  END IF;

  -- Disponibilidade: deve estar disponível e (ilimitada OU > 0)
  IF NOT card_available OR (current_copies IS NOT NULL AND current_copies <= 0) THEN
    RETURN json_build_object('success', false, 'error', 'Carta não disponível');
  END IF;

  -- Verificar saldo de moedas
  SELECT coins INTO user_coins FROM profiles WHERE id = user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  IF user_coins < card_price THEN
    RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  -- Transação: descontar moedas
  UPDATE profiles SET coins = coins - card_price WHERE id = user_id;

  -- Decrementar cópias somente se não for ilimitada (NULL)
  IF current_copies IS NOT NULL THEN
    UPDATE cards SET copies_available = copies_available - 1 WHERE id = card_id;
  END IF;

  -- Upsert seguro: primeiro tenta atualizar, se não houver linha, insere
  UPDATE user_cards
  SET quantity = quantity + 1
  WHERE user_id = buy_card.user_id AND card_id = buy_card.card_id;

  IF NOT FOUND THEN
    INSERT INTO user_cards (user_id, card_id, quantity)
    VALUES (user_id, card_id, 1);
  END IF;

  RETURN json_build_object('success', true, 'message', 'Carta comprada com sucesso');
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in buy_card: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', 'Erro interno. Tente novamente.');
END;
$$;