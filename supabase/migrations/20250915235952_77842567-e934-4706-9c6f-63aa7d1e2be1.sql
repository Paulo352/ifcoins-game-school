-- Atualizar função delete_event para incluir polls
CREATE OR REPLACE FUNCTION public.delete_event(event_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- Primeiro, remover votações associadas ao evento
    DELETE FROM public.poll_votes 
    WHERE option_id IN (
        SELECT po.id 
        FROM public.poll_options po 
        JOIN public.polls p ON p.id = po.poll_id 
        WHERE p.event_id = delete_event.event_id
    );
    
    -- Remover opções de votação
    DELETE FROM public.poll_options 
    WHERE poll_id IN (
        SELECT id FROM public.polls WHERE event_id = delete_event.event_id
    );
    
    -- Remover polls associados ao evento
    DELETE FROM public.polls WHERE event_id = delete_event.event_id;
    
    -- Remover cartas associadas ao evento
    DELETE FROM public.event_cards WHERE event_id = delete_event.event_id;
    
    -- Finalmente, deletar o evento
    DELETE FROM public.events WHERE id = event_id;
    
    RETURN FOUND;
END;
$function$;