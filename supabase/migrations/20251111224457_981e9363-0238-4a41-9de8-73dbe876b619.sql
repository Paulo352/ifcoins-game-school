-- Atualizar RLS policies para cartas exclusivas

-- Remover política antiga de visualização geral
DROP POLICY IF EXISTS "Anyone can view available cards" ON public.cards;

-- Nova política: apenas cartas normais disponíveis são visíveis para todos
CREATE POLICY "Anyone can view normal available cards"
  ON public.cards FOR SELECT
  USING (available = true AND (is_special = false OR is_special IS NULL));

-- Nova política: usuário pode ver cartas exclusivas atribuídas a ele
CREATE POLICY "Users can view their exclusive cards"
  ON public.cards FOR SELECT
  USING (is_special = true AND assigned_to = auth.uid());

-- Admins podem ver todas as cartas
CREATE POLICY "Admins can view all cards including exclusive"
  ON public.cards FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Atualizar política de user_cards para excluir cartas exclusivas de outros
DROP POLICY IF EXISTS "Students can view other students cards for trading" ON public.user_cards;

CREATE POLICY "Students can view other students normal cards only"
  ON public.user_cards FOR SELECT
  USING (
    -- Usuário pode ver suas próprias cartas (inclusive exclusivas)
    (user_id = auth.uid()) OR
    -- Ou pode ver cartas normais de outros estudantes para trading
    (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student'::user_role) 
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = user_cards.user_id AND role = 'student'::user_role)
      AND EXISTS (SELECT 1 FROM public.cards WHERE id = user_cards.card_id AND (is_special = false OR is_special IS NULL))
    )
  );

-- Garantir que cartas exclusivas não podem ser negociadas
CREATE OR REPLACE FUNCTION public.validate_trade_no_exclusive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  card_id_key TEXT;
  is_exclusive BOOLEAN;
BEGIN
  -- Verificar cartas oferecidas
  FOR card_id_key IN SELECT jsonb_object_keys(NEW.offered_cards)
  LOOP
    SELECT is_special INTO is_exclusive
    FROM cards
    WHERE id = card_id_key::uuid;
    
    IF is_exclusive THEN
      RAISE EXCEPTION 'Cartas exclusivas não podem ser negociadas';
    END IF;
  END LOOP;

  -- Verificar cartas solicitadas
  FOR card_id_key IN SELECT jsonb_object_keys(NEW.requested_cards)
  LOOP
    SELECT is_special INTO is_exclusive
    FROM cards
    WHERE id = card_id_key::uuid;
    
    IF is_exclusive THEN
      RAISE EXCEPTION 'Cartas exclusivas não podem ser negociadas';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Criar trigger para validar trades
DROP TRIGGER IF EXISTS validate_trade_exclusive ON public.trades;
CREATE TRIGGER validate_trade_exclusive
  BEFORE INSERT OR UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION validate_trade_no_exclusive();

-- Garantir que cartas exclusivas não podem ser vendidas no marketplace
CREATE OR REPLACE FUNCTION public.validate_market_no_exclusive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_exclusive BOOLEAN;
BEGIN
  SELECT is_special INTO is_exclusive
  FROM cards
  WHERE id = NEW.card_id;
  
  IF is_exclusive THEN
    RAISE EXCEPTION 'Cartas exclusivas não podem ser vendidas no marketplace';
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para validar marketplace
DROP TRIGGER IF EXISTS validate_market_exclusive ON public.market_listings;
CREATE TRIGGER validate_market_exclusive
  BEFORE INSERT ON public.market_listings
  FOR EACH ROW
  EXECUTE FUNCTION validate_market_no_exclusive();