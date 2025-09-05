-- Criar sistema de votações (sem policy na view)
CREATE TABLE public.polls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    allow_multiple_votes BOOLEAN NOT NULL DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para opções de votação pré-registradas
CREATE TABLE public.poll_options (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para armazenar os votos
CREATE TABLE public.poll_votes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(poll_id, option_id, user_id) -- Impede votos duplicados na mesma opção
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para polls
CREATE POLICY "Admins can manage polls" ON public.polls FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role));

CREATE POLICY "Anyone can view active polls" ON public.polls FOR SELECT
USING (is_active = true);

-- Políticas para poll_options
CREATE POLICY "Admins can manage poll options" ON public.poll_options FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role));

CREATE POLICY "Anyone can view poll options" ON public.poll_options FOR SELECT
USING (EXISTS (SELECT 1 FROM public.polls WHERE id = poll_options.poll_id AND is_active = true));

-- Políticas para poll_votes
CREATE POLICY "Users can create their own votes" ON public.poll_votes FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own votes" ON public.poll_votes FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all votes" ON public.poll_votes FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role));

-- Função para criar uma votação com opções
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
    -- Verificar se o usuário é admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) THEN
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

-- Função para votar
CREATE OR REPLACE FUNCTION public.vote_in_poll(
    poll_id UUID,
    option_ids UUID[]
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    poll_allows_multiple BOOLEAN;
    poll_is_active BOOLEAN;
    poll_end_date TIMESTAMP WITH TIME ZONE;
    option_id UUID;
    existing_vote_count INTEGER;
BEGIN
    -- Verificar se a votação existe e está ativa
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

    -- Verificar se o usuário já votou
    SELECT COUNT(*) INTO existing_vote_count
    FROM public.poll_votes
    WHERE poll_votes.poll_id = vote_in_poll.poll_id AND user_id = auth.uid();

    -- Se não permite múltiplos votos e já votou, remover votos anteriores
    IF NOT poll_allows_multiple AND existing_vote_count > 0 THEN
        DELETE FROM public.poll_votes
        WHERE poll_votes.poll_id = vote_in_poll.poll_id AND user_id = auth.uid();
    END IF;

    -- Se permite múltiplos votos, verificar se não está votando na mesma opção novamente
    IF poll_allows_multiple THEN
        FOREACH option_id IN ARRAY option_ids
        LOOP
            -- Remover voto existente na mesma opção (toggle)
            DELETE FROM public.poll_votes
            WHERE poll_votes.poll_id = vote_in_poll.poll_id 
            AND poll_votes.option_id = option_id 
            AND user_id = auth.uid();
        END LOOP;
    END IF;

    -- Inserir novos votos
    FOREACH option_id IN ARRAY option_ids
    LOOP
        INSERT INTO public.poll_votes (poll_id, option_id, user_id)
        VALUES (poll_id, option_id, auth.uid())
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN TRUE;
END;
$$;