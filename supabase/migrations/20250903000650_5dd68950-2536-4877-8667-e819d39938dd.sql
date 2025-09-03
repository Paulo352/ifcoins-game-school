-- Criar função para processar trocas aceitas
CREATE OR REPLACE FUNCTION process_accepted_trade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_from_user_id UUID;
  v_to_user_id UUID;
  v_offered_cards JSONB;
  v_offered_coins INTEGER;
  v_requested_cards JSONB;
  v_requested_coins INTEGER;
  v_from_user_coins INTEGER;
  v_to_user_coins INTEGER;
  card_entry RECORD;
  v_user_card_id UUID;
  v_current_quantity INTEGER;
BEGIN
  -- Só processar se o status mudou para 'accepted'
  IF NEW.status != 'accepted' OR OLD.status = 'accepted' THEN
    RETURN NEW;
  END IF;

  v_from_user_id := NEW.from_user_id;
  v_to_user_id := NEW.to_user_id;
  v_offered_cards := NEW.offered_cards;
  v_offered_coins := NEW.offered_coins;
  v_requested_cards := NEW.requested_cards;
  v_requested_coins := NEW.requested_coins;

  -- Verificar moedas dos usuários
  SELECT coins INTO v_from_user_coins FROM profiles WHERE id = v_from_user_id;
  SELECT coins INTO v_to_user_coins FROM profiles WHERE id = v_to_user_id;

  -- Verificar se o usuário que oferece tem moedas suficientes
  IF v_from_user_coins < v_offered_coins THEN
    RAISE EXCEPTION 'Usuário não possui moedas suficientes para a troca';
  END IF;

  -- Verificar se o usuário que recebe tem moedas suficientes
  IF v_to_user_coins < v_requested_coins THEN
    RAISE EXCEPTION 'Usuário destinatário não possui moedas suficientes para a troca';
  END IF;

  -- Verificar se o usuário que oferece tem as cartas necessárias
  FOR card_entry IN SELECT key as card_id, value::integer as quantity FROM jsonb_each_text(v_offered_cards)
  LOOP
    SELECT quantity INTO v_current_quantity
    FROM user_cards 
    WHERE user_id = v_from_user_id AND card_id = card_entry.card_id::UUID;
    
    IF v_current_quantity IS NULL OR v_current_quantity < card_entry.quantity THEN
      RAISE EXCEPTION 'Usuário não possui cartas suficientes para a troca: %', card_entry.card_id;
    END IF;
  END LOOP;

  -- Verificar se o usuário que recebe tem as cartas solicitadas
  FOR card_entry IN SELECT key as card_id, value::integer as quantity FROM jsonb_each_text(v_requested_cards)
  LOOP
    SELECT quantity INTO v_current_quantity
    FROM user_cards 
    WHERE user_id = v_to_user_id AND card_id = card_entry.card_id::UUID;
    
    IF v_current_quantity IS NULL OR v_current_quantity < card_entry.quantity THEN
      RAISE EXCEPTION 'Usuário destinatário não possui cartas suficientes para a troca: %', card_entry.card_id;
    END IF;
  END LOOP;

  -- Processar transferência de moedas
  IF v_offered_coins > 0 THEN
    UPDATE profiles SET coins = coins - v_offered_coins WHERE id = v_from_user_id;
    UPDATE profiles SET coins = coins + v_offered_coins WHERE id = v_to_user_id;
  END IF;

  IF v_requested_coins > 0 THEN
    UPDATE profiles SET coins = coins - v_requested_coins WHERE id = v_to_user_id;
    UPDATE profiles SET coins = coins + v_requested_coins WHERE id = v_from_user_id;
  END IF;

  -- Processar transferência de cartas oferecidas (from -> to)
  FOR card_entry IN SELECT key as card_id, value::integer as quantity FROM jsonb_each_text(v_offered_cards)
  LOOP
    IF card_entry.quantity > 0 THEN
      -- Remover cartas do usuário que oferece
      UPDATE user_cards 
      SET quantity = quantity - card_entry.quantity 
      WHERE user_id = v_from_user_id AND card_id = card_entry.card_id::UUID;
      
      -- Remover registro se quantidade chegou a 0
      DELETE FROM user_cards 
      WHERE user_id = v_from_user_id AND card_id = card_entry.card_id::UUID AND quantity <= 0;
      
      -- Adicionar cartas ao usuário que recebe
      INSERT INTO user_cards (user_id, card_id, quantity)
      VALUES (v_to_user_id, card_entry.card_id::UUID, card_entry.quantity)
      ON CONFLICT (user_id, card_id) 
      DO UPDATE SET quantity = user_cards.quantity + card_entry.quantity;
    END IF;
  END LOOP;

  -- Processar transferência de cartas solicitadas (to -> from)
  FOR card_entry IN SELECT key as card_id, value::integer as quantity FROM jsonb_each_text(v_requested_cards)
  LOOP
    IF card_entry.quantity > 0 THEN
      -- Remover cartas do usuário que recebe
      UPDATE user_cards 
      SET quantity = quantity - card_entry.quantity 
      WHERE user_id = v_to_user_id AND card_id = card_entry.card_id::UUID;
      
      -- Remover registro se quantidade chegou a 0
      DELETE FROM user_cards 
      WHERE user_id = v_to_user_id AND card_id = card_entry.card_id::UUID AND quantity <= 0;
      
      -- Adicionar cartas ao usuário que oferece
      INSERT INTO user_cards (user_id, card_id, quantity)
      VALUES (v_from_user_id, card_entry.card_id::UUID, card_entry.quantity)
      ON CONFLICT (user_id, card_id) 
      DO UPDATE SET quantity = user_cards.quantity + card_entry.quantity;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Criar trigger para processar trocas aceitas
DROP TRIGGER IF EXISTS trigger_process_accepted_trade ON trades;
CREATE TRIGGER trigger_process_accepted_trade
  AFTER UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION process_accepted_trade();