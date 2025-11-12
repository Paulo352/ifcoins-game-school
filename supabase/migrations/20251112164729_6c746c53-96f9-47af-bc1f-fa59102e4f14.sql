-- Adicionar coluna created_by na tabela quizzes se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN created_by uuid REFERENCES profiles(id);
    
    -- Atualizar quizzes existentes para terem um created_by padrão (primeiro admin)
    UPDATE quizzes 
    SET created_by = (
      SELECT id FROM profiles WHERE role = 'admin' LIMIT 1
    )
    WHERE created_by IS NULL;
  END IF;
END $$;

-- Atualizar RLS policies para quizzes
DROP POLICY IF EXISTS "Professores e admins podem gerenciar quizzes" ON quizzes;
DROP POLICY IF EXISTS "Todos podem ver quizzes ativos" ON quizzes;

-- Professores só podem ver e editar seus próprios quizzes
CREATE POLICY "Professores podem gerenciar seus quizzes"
ON quizzes
FOR ALL
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND created_by = auth.uid()
);

-- Admins podem gerenciar todos os quizzes
CREATE POLICY "Admins podem gerenciar todos quizzes"
ON quizzes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Estudantes podem ver quizzes ativos
CREATE POLICY "Estudantes podem ver quizzes ativos"
ON quizzes
FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) AND is_active = true
);

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);
