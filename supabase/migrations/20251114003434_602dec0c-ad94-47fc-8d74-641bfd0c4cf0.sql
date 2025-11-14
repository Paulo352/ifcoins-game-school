-- Permitir professores e admins criarem salas multiplayer
DROP POLICY IF EXISTS "Teachers and admins can create rooms" ON quiz_rooms;
CREATE POLICY "Teachers and admins can create rooms"
ON quiz_rooms FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- Permitir professores e admins atualizarem salas (para iniciar partida, etc)
DROP POLICY IF EXISTS "Teachers and admins can update rooms" ON quiz_rooms;
CREATE POLICY "Teachers and admins can update rooms"
ON quiz_rooms FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- Atualizar política de SELECT para incluir admins e professores explicitamente
DROP POLICY IF EXISTS "Users can view rooms from their classes" ON quiz_rooms;
CREATE POLICY "Users can view rooms from their classes"
ON quiz_rooms FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role) OR
  class_id IS NULL OR
  EXISTS (
    SELECT 1 FROM class_students
    WHERE class_students.class_id = quiz_rooms.class_id
    AND class_students.student_id = auth.uid()
  )
);