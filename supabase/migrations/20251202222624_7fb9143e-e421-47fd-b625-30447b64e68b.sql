-- Drop and recreate delete_event function with corrected parameter name
DROP FUNCTION IF EXISTS public.delete_event(uuid);

CREATE OR REPLACE FUNCTION public.delete_event(p_event_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Delete poll votes for polls in this event
    DELETE FROM public.poll_votes 
    WHERE option_id IN (
        SELECT po.id 
        FROM public.poll_options po 
        JOIN public.polls p ON p.id = po.poll_id 
        WHERE p.event_id = p_event_id
    );
    
    -- Delete poll options for polls in this event
    DELETE FROM public.poll_options 
    WHERE poll_id IN (
        SELECT id FROM public.polls WHERE polls.event_id = p_event_id
    );
    
    -- Delete polls for this event
    DELETE FROM public.polls WHERE polls.event_id = p_event_id;
    
    -- Delete event cards
    DELETE FROM public.event_cards WHERE event_cards.event_id = p_event_id;
    
    -- Delete the event
    DELETE FROM public.events WHERE events.id = p_event_id;
    
    RETURN FOUND;
END;
$function$;