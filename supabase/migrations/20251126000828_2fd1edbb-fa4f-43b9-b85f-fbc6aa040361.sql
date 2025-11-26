-- Ajustar política RLS para permitir alunos entrarem via código
DROP POLICY IF EXISTS "Admins e professores podem adicionar alunos" ON class_students;

CREATE POLICY "Admins e professores podem adicionar alunos" ON class_students
FOR INSERT 
WITH CHECK (
  -- Admins e professores podem adicionar
  (added_by = auth.uid() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')))
  OR
  -- Alunos podem se adicionar via código de convite (student_id = auth.uid())
  (student_id = auth.uid() AND has_role(auth.uid(), 'student'))
);