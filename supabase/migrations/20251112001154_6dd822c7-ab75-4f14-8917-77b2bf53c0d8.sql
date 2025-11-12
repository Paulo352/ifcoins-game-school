-- Criar tabela de mensagens para turmas
CREATE TABLE IF NOT EXISTS public.class_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de convites para turmas
CREATE TABLE IF NOT EXISTS public.class_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT NULL,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_class_messages_class_id ON public.class_messages(class_id);
CREATE INDEX IF NOT EXISTS idx_class_messages_created_at ON public.class_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_class_invites_code ON public.class_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_class_invites_class_id ON public.class_invites(class_id);

-- RLS para class_messages
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;

-- Professores e admins podem enviar mensagens
CREATE POLICY "Professores e admins podem enviar mensagens"
  ON public.class_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Alunos da turma podem ver mensagens
CREATE POLICY "Alunos podem ver mensagens da sua turma"
  ON public.class_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students
      WHERE class_students.class_id = class_messages.class_id
      AND class_students.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- RLS para class_invites
ALTER TABLE public.class_invites ENABLE ROW LEVEL SECURITY;

-- Professores e admins podem criar convites
CREATE POLICY "Professores e admins podem criar convites"
  ON public.class_invites
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Professores e admins podem ver e gerenciar convites
CREATE POLICY "Professores e admins podem ver convites"
  ON public.class_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Professores e admins podem atualizar convites"
  ON public.class_invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Alunos podem ver convites ativos (para usar código)
CREATE POLICY "Alunos podem ver convites ativos"
  ON public.class_invites
  FOR SELECT
  USING (is_active = true);

-- Função para gerar código de convite único
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 8 caracteres
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM class_invites WHERE invite_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;