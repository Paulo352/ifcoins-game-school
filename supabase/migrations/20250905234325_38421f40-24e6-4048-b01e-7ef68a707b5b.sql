-- Fix enum casting with explicit schema in functions
CREATE OR REPLACE FUNCTION public.create_poll_with_options(
    poll_title TEXT,
    poll_description TEXT,
    poll_event_id UUID,
    allow_multiple BOOLEAN,
    end_date TIMESTAMP WITH TIME ZONE,
    options TEXT[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_poll_id UUID;
    option_text TEXT;
    option_index INTEGER := 0;
BEGIN
    -- Verificar se o usuário é admin (enum qualificado)
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'admin'::public.user_role
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem criar votações';
    END IF;

    -- Criar a votação
    INSERT INTO public.polls (title, description, event_id, created_by, allow_multiple_votes, end_date)
    VALUES (poll_title, poll_description, poll_event_id, auth.uid(), allow_multiple, end_date)
    RETURNING id INTO new_poll_id;

    -- Criar as opções
    FOREACH option_text IN ARRAY options
    LOOP
        INSERT INTO public.poll_options (poll_id, option_text, option_order)
        VALUES (new_poll_id, option_text, option_index);
        option_index := option_index + 1;
    END LOOP;

    RETURN new_poll_id;
END;
$$;