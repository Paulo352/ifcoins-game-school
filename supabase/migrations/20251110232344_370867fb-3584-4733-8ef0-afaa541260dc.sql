-- Adicionar política para admins gerenciarem cartas de outros usuários
CREATE POLICY "Admins can manage all user cards"
ON public.user_cards
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));