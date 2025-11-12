-- Fix database functions missing proper search_path
-- This addresses the security vulnerability where functions without search_path 
-- can be exploited via search_path manipulation

-- Functions with empty search_path - fix to use 'public'
CREATE OR REPLACE FUNCTION public.buy_card(card_id uuid, user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Changed from empty string
AS $function$
DECLARE
  v_card_id UUID := buy_card.card_id;
  v_user_id UUID := buy_card.user_id;
  v_card_price INTEGER;
  v_card_available BOOLEAN;
  v_copies_left INTEGER;
  v_user_coins INTEGER;
  v_rows_updated INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Acesso não autorizado');
  END IF;

  SELECT c.price, c.available, c.copies_available 
  INTO v_card_price, v_card_available, v_copies_left
  FROM public.cards c
  WHERE c.id = v_card_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Carta não encontrada');
  END IF;

  IF NOT v_card_available THEN
    RETURN json_build_object('success', false, 'error', 'Carta não está disponível');
  END IF;

  IF v_copies_left IS NOT NULL AND v_copies_left <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Não há cópias disponíveis');
  END IF;

  SELECT p.coins INTO v_user_coins
  FROM public.profiles p
  WHERE p.id = v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Perfil de usuário não encontrado');
  END IF;

  IF v_user_coins < v_card_price THEN
    RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  UPDATE public.profiles p
  SET coins = p.coins - v_card_price,
      updated_at = now()
  WHERE p.id = v_user_id;

  UPDATE public.user_cards uc
  SET quantity = uc.quantity + 1
  WHERE uc.user_id = v_user_id AND uc.card_id = v_card_id;
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    INSERT INTO public.user_cards (user_id, card_id, quantity)
    VALUES (v_user_id, v_card_id, 1);
  END IF;

  IF v_copies_left IS NOT NULL THEN
    UPDATE public.cards c
    SET copies_available = GREATEST(c.copies_available - 1, 0),
        updated_at = now()
    WHERE c.id = v_card_id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Carta comprada com sucesso');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro ao processar compra');
END;
$function$;

-- Fix create_event
CREATE OR REPLACE FUNCTION public.create_event(name text, description text, start_date date, end_date date, bonus_multiplier numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Changed from empty string
AS $function$
DECLARE
    new_event_id uuid;
BEGIN
    INSERT INTO public.events (name, description, start_date, end_date, bonus_multiplier)
    VALUES (name, description, start_date, end_date, bonus_multiplier)
    RETURNING id INTO new_event_id;
    
    RETURN new_event_id;
END;
$function$;

-- Fix update_event
CREATE OR REPLACE FUNCTION public.update_event(event_id uuid, name text, description text, start_date date, end_date date, bonus_multiplier numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Changed from empty string
AS $function$
BEGIN
    UPDATE public.events 
    SET name = update_event.name,
        description = update_event.description,
        start_date = update_event.start_date,
        end_date = update_event.end_date,
        bonus_multiplier = update_event.bonus_multiplier,
        updated_at = now()
    WHERE id = event_id;
    
    RETURN FOUND;
END;
$function$;

-- Fix delete_event
CREATE OR REPLACE FUNCTION public.delete_event(event_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Changed from empty string
AS $function$
BEGIN
    DELETE FROM public.poll_votes 
    WHERE option_id IN (
        SELECT po.id 
        FROM public.poll_options po 
        JOIN public.polls p ON p.id = po.poll_id 
        WHERE p.event_id = delete_event.event_id
    );
    
    DELETE FROM public.poll_options 
    WHERE poll_id IN (
        SELECT id FROM public.polls WHERE event_id = delete_event.event_id
    );
    
    DELETE FROM public.polls WHERE event_id = delete_event.event_id;
    DELETE FROM public.event_cards WHERE event_id = delete_event.event_id;
    DELETE FROM public.events WHERE id = event_id;
    
    RETURN FOUND;
END;
$function$;

-- Fix update_user_coins
CREATE OR REPLACE FUNCTION public.update_user_coins(user_id uuid, amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Changed from empty string
AS $function$
DECLARE
  v_user_id uuid := user_id;
  v_amount integer := amount;
BEGIN
  UPDATE public.profiles 
  SET coins = coins + v_amount,
      updated_at = now()
  WHERE public.profiles.id = v_user_id;
END;
$function$;

-- Fix get_poll_results
CREATE OR REPLACE FUNCTION public.get_poll_results(poll_id uuid)
 RETURNS TABLE(option_id uuid, option_text text, option_order integer, vote_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Changed from empty string
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    po.id AS option_id,
    po.option_text,
    po.option_order,
    COALESCE(COUNT(v.id), 0) AS vote_count
  FROM public.poll_options po
  LEFT JOIN public.poll_votes v ON v.option_id = po.id
  WHERE po.poll_id = get_poll_results.poll_id
  GROUP BY po.id, po.option_text, po.option_order
  ORDER BY po.option_order ASC;
END;
$function$;

-- Fix vote_in_poll
CREATE OR REPLACE FUNCTION public.vote_in_poll(poll_id uuid, option_ids uuid[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Changed from empty string
AS $function$
DECLARE
    poll_allows_multiple BOOLEAN;
    poll_is_active BOOLEAN;
    poll_end_date TIMESTAMP WITH TIME ZONE;
    option_id UUID;
    existing_vote_count INTEGER;
BEGIN
    SELECT allow_multiple_votes, is_active, end_date
    INTO poll_allows_multiple, poll_is_active, poll_end_date
    FROM public.polls
    WHERE id = poll_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Votação não encontrada';
    END IF;

    IF NOT poll_is_active THEN
        RAISE EXCEPTION 'Votação não está ativa';
    END IF;

    IF poll_end_date < now() THEN
        RAISE EXCEPTION 'Votação já encerrada';
    END IF;

    SELECT COUNT(*) INTO existing_vote_count
    FROM public.poll_votes
    WHERE poll_votes.poll_id = vote_in_poll.poll_id AND user_id = auth.uid();

    IF NOT poll_allows_multiple AND existing_vote_count > 0 THEN
        DELETE FROM public.poll_votes
        WHERE poll_votes.poll_id = vote_in_poll.poll_id AND user_id = auth.uid();
    END IF;

    IF poll_allows_multiple THEN
        FOREACH option_id IN ARRAY option_ids
        LOOP
            DELETE FROM public.poll_votes
            WHERE poll_votes.poll_id = vote_in_poll.poll_id 
            AND poll_votes.option_id = option_id 
            AND user_id = auth.uid();
        END LOOP;
    END IF;

    FOREACH option_id IN ARRAY option_ids
    LOOP
        INSERT INTO public.poll_votes (poll_id, option_id, user_id)
        VALUES (poll_id, option_id, auth.uid())
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN TRUE;
END;
$function$;

-- Fix create_poll_with_options
CREATE OR REPLACE FUNCTION public.create_poll_with_options(poll_title text, poll_description text, poll_event_id uuid, allow_multiple boolean, end_date timestamp with time zone, options text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Changed from empty string
AS $function$
DECLARE
    new_poll_id UUID;
    option_text TEXT;
    option_index INTEGER := 0;
BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'admin'::public.user_role
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem criar votações';
    END IF;

    INSERT INTO public.polls (title, description, event_id, created_by, allow_multiple_votes, end_date)
    VALUES (poll_title, poll_description, poll_event_id, auth.uid(), allow_multiple, end_date)
    RETURNING id INTO new_poll_id;

    FOREACH option_text IN ARRAY options
    LOOP
        INSERT INTO public.poll_options (poll_id, option_text, option_order)
        VALUES (new_poll_id, option_text, option_index);
        option_index := option_index + 1;
    END LOOP;

    RETURN new_poll_id;
END;
$function$;

-- Fix create_poll_with_options_and_images (was missing search_path completely)
CREATE OR REPLACE FUNCTION public.create_poll_with_options_and_images(poll_title text, poll_description text, poll_event_id uuid, allow_multiple boolean, end_date timestamp with time zone, options jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- ADDED missing search_path
AS $function$
DECLARE
  new_poll_id uuid;
  option_item jsonb;
BEGIN
  INSERT INTO polls (title, description, event_id, allow_multiple_votes, end_date, created_by)
  VALUES (poll_title, poll_description, poll_event_id, allow_multiple, end_date, auth.uid())
  RETURNING id INTO new_poll_id;
  
  FOR option_item IN SELECT * FROM jsonb_array_elements(options)
  LOOP
    INSERT INTO poll_options (poll_id, option_text, option_order, image_url)
    VALUES (
      new_poll_id,
      option_item->>'option_text',
      (option_item->>'option_order')::integer,
      option_item->>'image_url'
    );
  END LOOP;
  
  RETURN new_poll_id;
END;
$function$;

-- Fix process_accepted_trade  
CREATE OR REPLACE FUNCTION public.process_accepted_trade()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Changed from empty string
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
  IF NEW.status != 'accepted' OR OLD.status = 'accepted' THEN
    RETURN NEW;
  END IF;

  v_from_user_id := NEW.from_user_id;
  v_to_user_id := NEW.to_user_id;
  v_offered_cards := NEW.offered_cards;
  v_offered_coins := NEW.offered_coins;
  v_requested_cards := NEW.requested_cards;
  v_requested_coins := NEW.requested_coins;

  SELECT coins INTO v_from_user_coins FROM public.profiles WHERE id = v_from_user_id;
  SELECT coins INTO v_to_user_coins FROM public.profiles WHERE id = v_to_user_id;

  IF v_from_user_coins < v_offered_coins THEN
    RAISE EXCEPTION 'Usuário não possui moedas suficientes para a troca';
  END IF;

  IF v_to_user_coins < v_requested_coins THEN
    RAISE EXCEPTION 'Usuário destinatário não possui moedas suficientes para a troca';
  END IF;

  FOR card_entry IN SELECT key as card_id, value::integer as quantity FROM jsonb_each_text(v_offered_cards)
  LOOP
    SELECT quantity INTO v_current_quantity
    FROM public.user_cards 
    WHERE user_id = v_from_user_id AND card_id = card_entry.card_id::UUID;
    
    IF v_current_quantity IS NULL OR v_current_quantity < card_entry.quantity THEN
      RAISE EXCEPTION 'Usuário não possui cartas suficientes para a troca: %', card_entry.card_id;
    END IF;
  END LOOP;

  FOR card_entry IN SELECT key as card_id, value::integer as quantity FROM jsonb_each_text(v_requested_cards)
  LOOP
    SELECT quantity INTO v_current_quantity
    FROM public.user_cards 
    WHERE user_id = v_to_user_id AND card_id = card_entry.card_id::UUID;
    
    IF v_current_quantity IS NULL OR v_current_quantity < card_entry.quantity THEN
      RAISE EXCEPTION 'Usuário destinatário não possui cartas suficientes para a troca: %', card_entry.card_id;
    END IF;
  END LOOP;

  IF v_offered_coins > 0 THEN
    UPDATE public.profiles SET coins = coins - v_offered_coins WHERE id = v_from_user_id;
    UPDATE public.profiles SET coins = coins + v_offered_coins WHERE id = v_to_user_id;
  END IF;

  IF v_requested_coins > 0 THEN
    UPDATE public.profiles SET coins = coins - v_requested_coins WHERE id = v_to_user_id;
    UPDATE public.profiles SET coins = coins + v_requested_coins WHERE id = v_from_user_id;
  END IF;

  FOR card_entry IN SELECT key as card_id, value::integer as quantity FROM jsonb_each_text(v_offered_cards)
  LOOP
    IF card_entry.quantity > 0 THEN
      UPDATE public.user_cards 
      SET quantity = quantity - card_entry.quantity 
      WHERE user_id = v_from_user_id AND card_id = card_entry.card_id::UUID;
      
      DELETE FROM public.user_cards 
      WHERE user_id = v_from_user_id AND card_id = card_entry.card_id::UUID AND quantity <= 0;
      
      INSERT INTO public.user_cards (user_id, card_id, quantity)
      VALUES (v_to_user_id, card_entry.card_id::UUID, card_entry.quantity)
      ON CONFLICT (user_id, card_id) 
      DO UPDATE SET quantity = public.user_cards.quantity + card_entry.quantity;
    END IF;
  END LOOP;

  FOR card_entry IN SELECT key as card_id, value::integer as quantity FROM jsonb_each_text(v_requested_cards)
  LOOP
    IF card_entry.quantity > 0 THEN
      UPDATE public.user_cards 
      SET quantity = quantity - card_entry.quantity 
      WHERE user_id = v_to_user_id AND card_id = card_entry.card_id::UUID;
      
      DELETE FROM public.user_cards 
      WHERE user_id = v_to_user_id AND card_id = card_entry.card_id::UUID AND quantity <= 0;
      
      INSERT INTO public.user_cards (user_id, card_id, quantity)
      VALUES (v_from_user_id, card_entry.card_id::UUID, card_entry.quantity)
      ON CONFLICT (user_id, card_id) 
      DO UPDATE SET quantity = public.user_cards.quantity + card_entry.quantity;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;