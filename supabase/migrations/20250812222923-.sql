-- Update remaining database functions to use secure search_path
CREATE OR REPLACE FUNCTION public.update_event(event_id uuid, name text, description text, start_date date, end_date date, bonus_multiplier numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.delete_event(event_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- Primeiro, remover cartas associadas ao evento
    DELETE FROM public.event_cards WHERE event_id = delete_event.event_id;
    
    -- Depois, deletar o evento
    DELETE FROM public.events WHERE id = event_id;
    
    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.buy_card(card_id uuid, user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    card_price integer;
    user_coins integer;
    card_available boolean;
    copies_available integer;
BEGIN
    -- Verificar se a carta existe e está disponível
    SELECT price, available, copies_available 
    INTO card_price, card_available, copies_available
    FROM public.cards 
    WHERE id = card_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Carta não encontrada');
    END IF;
    
    IF NOT card_available OR copies_available <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Carta não disponível');
    END IF;
    
    -- Verificar moedas do usuário
    SELECT coins INTO user_coins FROM public.profiles WHERE id = user_id;
    
    IF user_coins < card_price THEN
        RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
    END IF;
    
    -- Realizar a transação
    UPDATE public.profiles SET coins = coins - card_price WHERE id = user_id;
    UPDATE public.cards SET copies_available = copies_available - 1 WHERE id = card_id;
    
    -- Adicionar carta ao usuário
    INSERT INTO public.user_cards (user_id, card_id, quantity)
    VALUES (user_id, card_id, 1)
    ON CONFLICT (user_id, card_id) 
    DO UPDATE SET quantity = public.user_cards.quantity + 1;
    
    RETURN json_build_object('success', true, 'message', 'Carta comprada com sucesso');
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_event(name text, description text, start_date date, end_date date, bonus_multiplier numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
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