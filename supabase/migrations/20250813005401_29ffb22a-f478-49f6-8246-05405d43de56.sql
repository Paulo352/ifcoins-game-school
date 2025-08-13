
-- Recreate buy_card without requiring a unique constraint on user_cards
CREATE OR REPLACE FUNCTION public.buy_card(card_id uuid, user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_card_price INTEGER;
  v_card_available BOOLEAN;
  v_copies_left INTEGER;
  v_user_id UUID := user_id; -- copy param into local var
  v_profile_rec public.profiles%ROWTYPE;
  v_rows_updated INTEGER;
BEGIN
  -- Auth guard: user can only buy for themselves
  IF auth.uid() IS NULL OR auth.uid() <> v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Acesso não autorizado');
  END IF;

  -- Get card info
  SELECT price, available, copies_available 
  INTO v_card_price, v_card_available, v_copies_left
  FROM public.cards 
  WHERE id = card_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Carta não encontrada');
  END IF;

  IF NOT v_card_available THEN
    RETURN json_build_object('success', false, 'error', 'Carta não está disponível');
  END IF;

  IF COALESCE(v_copies_left, 0) <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Não há cópias disponíveis');
  END IF;

  -- Get user profile
  SELECT * INTO v_profile_rec
  FROM public.profiles 
  WHERE public.profiles.id = v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Perfil de usuário não encontrado');
  END IF;

  IF v_profile_rec.coins < v_card_price THEN
    RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  -- Deduct coins
  UPDATE public.profiles 
  SET coins = coins - v_card_price,
      updated_at = now()
  WHERE public.profiles.id = v_user_id;

  -- Try to update existing user_cards row
  UPDATE public.user_cards
  SET quantity = quantity + 1
  WHERE user_id = v_user_id AND card_id = card_id;
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  -- If no row was updated, insert a new one
  IF v_rows_updated = 0 THEN
    INSERT INTO public.user_cards (user_id, card_id, quantity)
    VALUES (v_user_id, card_id, 1);
  END IF;

  -- Decrease available copies (only if not unlimited)
  IF v_copies_left IS NOT NULL THEN
    UPDATE public.cards 
    SET copies_available = copies_available - 1,
        updated_at = now()
    WHERE id = card_id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Carta comprada com sucesso');
END;
$function$;
