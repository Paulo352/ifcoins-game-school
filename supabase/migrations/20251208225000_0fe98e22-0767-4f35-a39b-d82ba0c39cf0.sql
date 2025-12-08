-- Criar política para permitir que todos os usuários autenticados vejam informações básicas de criadores
CREATE POLICY "Authenticated users can view creators basic info"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (role IN ('teacher', 'admin'))
);