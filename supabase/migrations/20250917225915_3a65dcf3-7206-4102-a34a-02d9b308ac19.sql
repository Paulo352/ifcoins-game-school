-- Primeiro, vamos adicionar a coluna pack_type que está faltando na tabela packs
ALTER TABLE public.packs 
ADD COLUMN IF NOT EXISTS pack_type text NOT NULL DEFAULT 'random' CHECK (pack_type IN ('random', 'fixed'));

-- Criar tabela para relacionar pacotes com cartas específicas (para pacotes fixos)
CREATE TABLE IF NOT EXISTS public.pack_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(pack_id, card_id)
);

-- Habilitar RLS na tabela pack_cards
ALTER TABLE public.pack_cards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pack_cards
CREATE POLICY "Admins can manage pack cards" 
ON public.pack_cards 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'::user_role
));

CREATE POLICY "Students can view pack cards" 
ON public.pack_cards 
FOR SELECT
USING (true);

-- Criar tabela para histórico de compras de pacotes
CREATE TABLE IF NOT EXISTS public.pack_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE RESTRICT,
  cards_received jsonb NOT NULL DEFAULT '[]'::jsonb,
  coins_spent integer NOT NULL,
  purchased_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela pack_purchases
ALTER TABLE public.pack_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pack_purchases
CREATE POLICY "Users can view own pack purchases" 
ON public.pack_purchases 
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create pack purchases" 
ON public.pack_purchases 
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all pack purchases" 
ON public.pack_purchases 
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'::user_role
));

-- Criar função para comprar pacotes
CREATE OR REPLACE FUNCTION public.buy_pack(pack_id uuid, user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_pack_id UUID := buy_pack.pack_id;
  v_user_id UUID := buy_pack.user_id;
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
  v_selected_cards RECORD[];
  v_pack_cards RECORD[];
BEGIN
  -- Auth guard: user can only buy for themselves
  IF auth.uid() IS NULL OR auth.uid() <> v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Acesso não autorizado');
  END IF;

  -- Get pack info
  SELECT p.price, p.available, p.pack_type, p.limit_per_student
  INTO v_pack_price, v_pack_available, v_pack_type, v_limit_per_student
  FROM public.packs p
  WHERE p.id = v_pack_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pacote não encontrado');
  END IF;

  IF NOT v_pack_available THEN
    RETURN json_build_object('success', false, 'error', 'Pacote não está disponível');
  END IF;

  -- Check purchase limit
  SELECT COUNT(*) INTO v_purchases_count
  FROM public.pack_purchases
  WHERE user_id = v_user_id AND pack_id = v_pack_id;

  IF v_purchases_count >= v_limit_per_student THEN
    RETURN json_build_object('success', false, 'error', 'Limite de compras atingido para este pacote');
  END IF;

  -- Get user coins
  SELECT p.coins INTO v_user_coins
  FROM public.profiles p
  WHERE p.id = v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Perfil de usuário não encontrado');
  END IF;

  IF v_user_coins < v_pack_price THEN
    RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  -- Deduct coins
  UPDATE public.profiles p
  SET coins = p.coins - v_pack_price,
      updated_at = now()
  WHERE p.id = v_user_id;

  -- Generate cards based on pack type
  IF v_pack_type = 'fixed' THEN
    -- For fixed packs, get predefined cards
    FOR v_card IN
      SELECT pc.card_id, pc.quantity, c.name, c.rarity
      FROM public.pack_cards pc
      JOIN public.cards c ON c.id = pc.card_id
      WHERE pc.pack_id = v_pack_id
    LOOP
      -- Add card to user collection
      INSERT INTO public.user_cards (user_id, card_id, quantity)
      VALUES (v_user_id, v_card.card_id, v_card.quantity)
      ON CONFLICT (user_id, card_id) 
      DO UPDATE SET quantity = public.user_cards.quantity + v_card.quantity;
      
      -- Add to received cards list
      v_cards_received := v_cards_received || jsonb_build_object(
        'card_id', v_card.card_id,
        'name', v_card.name,
        'rarity', v_card.rarity,
        'quantity', v_card.quantity
      );
    END LOOP;
  ELSE
    -- For random packs, generate based on probabilities
    -- This is a simplified version - you might want to make it more sophisticated
    FOR i IN 1..3 LOOP -- 3 cards per pack
      v_random_num := floor(random() * 100) + 1;
      
      -- Determine rarity based on pack probabilities
      SELECT 
        CASE 
          WHEN v_random_num <= p.probability_mythic THEN 'mythic'
          WHEN v_random_num <= p.probability_mythic + p.probability_legendary THEN 'legendary'
          WHEN v_random_num <= p.probability_mythic + p.probability_legendary + p.probability_rare THEN 'rare'
          ELSE 'common'
        END INTO v_rarity
      FROM public.packs p WHERE p.id = v_pack_id;
      
      -- Get random card of determined rarity
      SELECT c.id, c.name, c.rarity INTO v_card
      FROM public.cards c
      WHERE c.rarity::text = v_rarity AND c.available = true
      ORDER BY random()
      LIMIT 1;
      
      IF FOUND THEN
        -- Add card to user collection
        INSERT INTO public.user_cards (user_id, card_id, quantity)
        VALUES (v_user_id, v_card.id, 1)
        ON CONFLICT (user_id, card_id) 
        DO UPDATE SET quantity = public.user_cards.quantity + 1;
        
        -- Add to received cards list
        v_cards_received := v_cards_received || jsonb_build_object(
          'card_id', v_card.id,
          'name', v_card.name,
          'rarity', v_card.rarity,
          'quantity', 1
        );
      END IF;
    END LOOP;
  END IF;

  -- Record the purchase
  INSERT INTO public.pack_purchases (user_id, pack_id, cards_received, coins_spent)
  VALUES (v_user_id, v_pack_id, v_cards_received, v_pack_price);

  RETURN json_build_object(
    'success', true, 
    'message', 'Pacote comprado com sucesso',
    'cards_received', v_cards_received
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', COALESCE(SQLERRM, 'Erro interno na compra'));
END;
$function$;