-- Permitir que estudantes vejam detalhes das cartas que outros estudantes possuem
-- Necessário para o sistema de trocas funcionar corretamente
CREATE POLICY "Students can view cards owned by other students"
ON cards
FOR SELECT
USING (
  -- Estudantes podem ver cartas que outros estudantes possuem
  has_role(auth.uid(), 'student'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM user_cards 
    WHERE user_cards.card_id = cards.id
  )
);