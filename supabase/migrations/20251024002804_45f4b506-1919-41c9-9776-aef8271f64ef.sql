-- Permitir que estudantes vejam cartas de outros estudantes para o sistema de trocas
CREATE POLICY "Students can view other students cards for trading"
ON public.user_cards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'student'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_cards.user_id
    AND profiles.role = 'student'
  )
);