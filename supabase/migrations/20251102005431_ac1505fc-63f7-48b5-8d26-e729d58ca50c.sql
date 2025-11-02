-- Remover política restritiva antiga
DROP POLICY IF EXISTS "Admins can manage admin config" ON public.admin_config;

-- Criar políticas separadas: todos podem ler, só admins podem modificar
CREATE POLICY "Everyone can read admin config"
ON public.admin_config
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert admin config"
ON public.admin_config
FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Only admins can update admin config"
ON public.admin_config
FOR UPDATE
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Only admins can delete admin config"
ON public.admin_config
FOR DELETE
TO authenticated
USING (get_current_user_role() = 'admin');