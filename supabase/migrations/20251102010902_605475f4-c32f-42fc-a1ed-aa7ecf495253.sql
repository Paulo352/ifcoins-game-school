-- Remover função antiga e recriar do zero
DROP FUNCTION IF EXISTS public.buy_pack(uuid, uuid);

-- Recriar função buy_pack com lógica simplificada e corrigida
CREATE OR REPLACE FUNCTION public.buy_pack(pack_id uuid, user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pack_price INTEGER;
  v_pack_available BOOLEAN;
  v_pack_type TEXT;
  v_limit_per_student INTEGER;
  v_user_coins INTEGER;
  v_purchases_count INTEGER;
  v_cards_received JSONB := '[]'::jsonb;
  v_card RECORD;
  v_random_num INTEGER;
  v_rarity TEXT;
  v_user_card_quantity INTEGER;
BEGIN
  -- Verificação de autenticação: usuário só pode comprar para si mesmo
  IF auth.uid() IS NULL OR auth.uid() <> user_id THEN
    RETURN json_build_object('success', false, 'error', 'Acesso não autorizado');
  END IF;

  -- Buscar informações do pacote
  SELECT price, available, pack_type, limit_per_student
  INTO v_pack_price, v_pack_available, v_pack_type, v_limit_per_student
  FROM packs
  WHERE id = pack_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pacote não encontrado');
  END IF;

  IF NOT v_pack_available THEN
    RETURN json_build_object('success', false, 'error', 'Pacote não disponível');
  END IF;

  -- Verificar limite de compras
  SELECT COUNT(*) INTO v_purchases_count
  FROM pack_purchases
  WHERE pack_purchases.user_id = buy_pack.user_id AND pack_purchases.pack_id = buy_pack.pack_id;

  IF v_purchases_count >= v_limit_per_student THEN
    RETURN json_build_object('success', false, 'error', 'Limite de compras atingido');
  END IF;

  -- Buscar moedas do usuário
  SELECT coins INTO v_user_coins
  FROM profiles
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Perfil não encontrado');
  END IF;

  IF v_user_coins < v_pack_price THEN
    RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  -- Deduzir moedas
  UPDATE profiles
  SET coins = coins - v_pack_price,
      updated_at = now()
  WHERE id = user_id;

  -- Gerar cartas baseado no tipo de pacote
  IF v_pack_type = 'fixed' THEN
    -- Pacotes fixos: pegar cartas pré-definidas
    FOR v_card IN
      SELECT pc.card_id, pc.quantity, c.name, c.rarity
      FROM pack_cards pc
      JOIN cards c ON c.id = pc.card_id
      WHERE pc.pack_id = buy_pack.pack_id
    LOOP
      -- Verificar se usuário já tem a carta
      SELECT quantity INTO v_user_card_quantity
      FROM user_cards
      WHERE user_cards.user_id = buy_pack.user_id AND card_id = v_card.card_id;
      
      IF v_user_card_quantity IS NULL THEN
        -- Inserir nova carta
        INSERT INTO user_cards (user_id, card_id, quantity)
        VALUES (buy_pack.user_id, v_card.card_id, v_card.quantity);
      ELSE
        -- Atualizar quantidade existente
        UPDATE user_cards
        SET quantity = quantity + v_card.quantity
        WHERE user_cards.user_id = buy_pack.user_id AND card_id = v_card.card_id;
      END IF;
      
      -- Adicionar à lista de cartas recebidas
      v_cards_received := v_cards_received || jsonb_build_object(
        'card_id', v_card.card_id,
        'name', v_card.name,
        'rarity', v_card.rarity,
        'quantity', v_card.quantity
      );
    END LOOP;
  ELSE
    -- Pacotes aleatórios: gerar 3 cartas baseado nas probabilidades
    FOR i IN 1..3 LOOP
      v_random_num := floor(random() * 100) + 1;
      
      -- Determinar raridade baseado nas probabilidades do pacote
      SELECT 
        CASE 
          WHEN v_random_num <= p.probability_mythic THEN 'mythic'
          WHEN v_random_num <= p.probability_mythic + p.probability_legendary THEN 'legendary'
          WHEN v_random_num <= p.probability_mythic + p.probability_legendary + p.probability_rare THEN 'rare'
          ELSE 'common'
        END INTO v_rarity
      FROM packs p WHERE p.id = buy_pack.pack_id;
      
      -- Pegar carta aleatória da raridade determinada
      SELECT c.id, c.name, c.rarity INTO v_card
      FROM cards c
      WHERE c.rarity::text = v_rarity AND c.available = true
      ORDER BY random()
      LIMIT 1;
      
      IF FOUND THEN
        -- Verificar se usuário já tem a carta
        SELECT quantity INTO v_user_card_quantity
        FROM user_cards
        WHERE user_cards.user_id = buy_pack.user_id AND card_id = v_card.id;
        
        IF v_user_card_quantity IS NULL THEN
          -- Inserir nova carta
          INSERT INTO user_cards (user_id, card_id, quantity)
          VALUES (buy_pack.user_id, v_card.id, 1);
        ELSE
          -- Atualizar quantidade existente
          UPDATE user_cards
          SET quantity = quantity + 1
          WHERE user_cards.user_id = buy_pack.user_id AND card_id = v_card.id;
        END IF;
        
        -- Adicionar à lista de cartas recebidas
        v_cards_received := v_cards_received || jsonb_build_object(
          'card_id', v_card.id,
          'name', v_card.name,
          'rarity', v_card.rarity,
          'quantity', 1
        );
      END IF;
    END LOOP;
  END IF;

  -- Registrar a compra
  INSERT INTO pack_purchases (user_id, pack_id, cards_received, coins_spent)
  VALUES (user_id, pack_id, v_cards_received, v_pack_price);

  RETURN json_build_object(
    'success', true, 
    'message', 'Pacote comprado com sucesso!',
    'cards_received', v_cards_received
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;