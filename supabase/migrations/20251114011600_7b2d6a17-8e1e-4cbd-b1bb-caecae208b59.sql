-- Permitir que estudantes vejam as cartas de outros estudantes
-- Necessário para o sistema de trocas
CREATE POLICY "Students can view other students cards"
ON user_cards
FOR SELECT
USING (
  -- Estudantes podem ver as cartas de outros estudantes
  has_role(auth.uid(), 'student'::app_role)
);