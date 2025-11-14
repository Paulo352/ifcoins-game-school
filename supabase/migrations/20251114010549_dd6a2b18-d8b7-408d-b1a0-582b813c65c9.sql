-- Permitir que estudantes vejam informações básicas de outros estudantes
-- Necessário para sistema de trocas e rankings
CREATE POLICY "Students can view other students basic info"
ON profiles
FOR SELECT
USING (
  -- Estudantes podem ver informações básicas (id, name) de outros estudantes
  (has_role(auth.uid(), 'student'::app_role) AND role = 'student'::user_role)
);