-- Adicionar política RLS para admins visualizarem todas as trocas
CREATE POLICY "Admins can view all trades"
ON public.trades
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));