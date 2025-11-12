-- Remover políticas antigas de classes
DROP POLICY IF EXISTS "Admins e professores podem criar turmas" ON public.classes;
DROP POLICY IF EXISTS "Admins e professores podem ver turmas" ON public.classes;
DROP POLICY IF EXISTS "Admins podem deletar turmas" ON public.classes;
DROP POLICY IF EXISTS "Criadores podem atualizar suas turmas" ON public.classes;

-- Criar novas políticas mais simples e funcionais
-- Professores e admins podem ver todas as turmas
CREATE POLICY "Professores e admins podem ver turmas"
  ON public.classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Professores e admins podem criar turmas
CREATE POLICY "Professores e admins podem criar turmas"
  ON public.classes
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Professores podem atualizar suas turmas, admins podem atualizar todas
CREATE POLICY "Professores e admins podem atualizar turmas"
  ON public.classes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.role = 'teacher' AND classes.created_by = auth.uid())
        OR (profiles.role = 'teacher' AND classes.teacher_id = auth.uid())
        OR (profiles.role = 'teacher' AND auth.uid() = ANY(classes.additional_teachers))
      )
    )
  );

-- Apenas admins podem deletar turmas
CREATE POLICY "Admins podem deletar turmas"
  ON public.classes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );