-- Adicionar suporte a turmas nos quizzes
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id) ON DELETE CASCADE;

-- Adicionar índice para melhorar performance de consultas por turma
CREATE INDEX IF NOT EXISTS idx_quizzes_class_id ON quizzes(class_id);

-- Atualizar política RLS para permitir alunos verem quizzes de suas turmas
DROP POLICY IF EXISTS "Students can view quizzes from their classes" ON quizzes;
CREATE POLICY "Students can view quizzes from their classes"
ON quizzes FOR SELECT
USING (
  is_active = true AND (
    class_id IS NULL OR
    EXISTS (
      SELECT 1 FROM class_students
      WHERE class_students.class_id = quizzes.class_id
      AND class_students.student_id = auth.uid()
    )
  )
);

-- Adicionar suporte a turmas nas salas multiplayer
ALTER TABLE quiz_rooms 
ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id) ON DELETE CASCADE;

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_quiz_rooms_class_id ON quiz_rooms(class_id);

-- Atualizar política RLS para salas multiplayer
DROP POLICY IF EXISTS "Users can view rooms from their classes" ON quiz_rooms;
CREATE POLICY "Users can view rooms from their classes"
ON quiz_rooms FOR SELECT
USING (
  class_id IS NULL OR
  EXISTS (
    SELECT 1 FROM class_students
    WHERE class_students.class_id = quiz_rooms.class_id
    AND class_students.student_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);