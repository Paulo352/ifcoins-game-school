-- Criar tabela para salas de quiz multiplayer
CREATE TABLE IF NOT EXISTS public.quiz_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  max_players INTEGER NOT NULL DEFAULT 10,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para participantes das salas
CREATE TABLE IF NOT EXISTS public.quiz_room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.quiz_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Criar tabela para badges personalizadas
CREATE TABLE IF NOT EXISTS public.custom_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#FFD700',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para atribuição de badges personalizadas
CREATE TABLE IF NOT EXISTS public.user_custom_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID NOT NULL REFERENCES public.custom_badges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  awarded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(badge_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.quiz_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_badges ENABLE ROW LEVEL SECURITY;

-- Políticas para quiz_rooms
CREATE POLICY "Todos podem ver salas ativas"
  ON public.quiz_rooms FOR SELECT
  USING (status IN ('waiting', 'active'));

CREATE POLICY "Professores e admins podem criar salas"
  ON public.quiz_rooms FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND 
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  );

CREATE POLICY "Criadores podem atualizar suas salas"
  ON public.quiz_rooms FOR UPDATE
  USING (created_by = auth.uid());

-- Políticas para quiz_room_players
CREATE POLICY "Todos podem ver participantes"
  ON public.quiz_room_players FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem entrar em salas"
  ON public.quiz_room_players FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar sua participação"
  ON public.quiz_room_players FOR UPDATE
  USING (user_id = auth.uid());

-- Políticas para custom_badges
CREATE POLICY "Todos podem ver badges personalizadas"
  ON public.custom_badges FOR SELECT
  USING (true);

CREATE POLICY "Professores e admins podem criar badges"
  ON public.custom_badges FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND 
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  );

CREATE POLICY "Criadores podem atualizar suas badges"
  ON public.custom_badges FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Criadores podem deletar suas badges"
  ON public.custom_badges FOR DELETE
  USING (created_by = auth.uid());

-- Políticas para user_custom_badges
CREATE POLICY "Todos podem ver badges conquistadas"
  ON public.user_custom_badges FOR SELECT
  USING (true);

CREATE POLICY "Professores e admins podem atribuir badges"
  ON public.user_custom_badges FOR INSERT
  WITH CHECK (
    awarded_by = auth.uid() AND 
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  );

CREATE POLICY "Professores e admins podem remover badges"
  ON public.user_custom_badges FOR DELETE
  USING (
    awarded_by = auth.uid() AND 
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  );

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_quiz_rooms_status ON public.quiz_rooms(status);
CREATE INDEX IF NOT EXISTS idx_quiz_rooms_code ON public.quiz_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_quiz_room_players_room ON public.quiz_room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_quiz_room_players_user ON public.quiz_room_players(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_badges_user ON public.user_custom_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_badges_badge ON public.user_custom_badges(badge_id);

-- Função para gerar código de sala único
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 6 caracteres
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM quiz_rooms WHERE room_code = code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Habilitar realtime para salas multiplayer
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_room_players;

-- Adicionar REPLICA IDENTITY FULL para realtime funcionar corretamente
ALTER TABLE quiz_rooms REPLICA IDENTITY FULL;
ALTER TABLE quiz_room_players REPLICA IDENTITY FULL;