-- Fix buy_card function with proper error handling and security
CREATE OR REPLACE FUNCTION public.buy_card(card_id uuid, user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    card_price integer;
    user_coins integer;
    card_available boolean;
    copies_available integer;
BEGIN
    -- Verificar se a carta existe e está disponível
    SELECT price, available, COALESCE(copies_available, 999) 
    INTO card_price, card_available, copies_available
    FROM cards 
    WHERE id = card_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Carta não encontrada');
    END IF;
    
    IF NOT card_available OR copies_available <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Carta não disponível');
    END IF;
    
    -- Verificar moedas do usuário
    SELECT coins INTO user_coins FROM profiles WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
    END IF;
    
    IF user_coins < card_price THEN
        RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
    END IF;
    
    -- Realizar a transação
    UPDATE profiles SET coins = coins - card_price WHERE id = user_id;
    
    -- Atualizar copies disponíveis apenas se não for null
    IF copies_available IS NOT NULL AND copies_available < 999 THEN
        UPDATE cards SET copies_available = copies_available - 1 WHERE id = card_id;
    END IF;
    
    -- Adicionar carta ao usuário
    INSERT INTO user_cards (user_id, card_id, quantity)
    VALUES (user_id, card_id, 1)
    ON CONFLICT (user_id, card_id) 
    DO UPDATE SET quantity = user_cards.quantity + 1;
    
    RETURN json_build_object('success', true, 'message', 'Carta comprada com sucesso');
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and return a generic message
        RAISE LOG 'Error in buy_card function: %', SQLERRM;
        RETURN json_build_object('success', false, 'error', 'Erro interno. Tente novamente.');
END;
$function$;