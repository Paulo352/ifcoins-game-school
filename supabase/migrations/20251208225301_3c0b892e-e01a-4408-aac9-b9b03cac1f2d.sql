-- Criar função security definer para buscar nomes de criadores de conteúdo
-- Isso permite que qualquer usuário autenticado veja o nome de professores/admins que criaram conteúdo
CREATE OR REPLACE FUNCTION public.get_creator_info(creator_ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.role::text
  FROM profiles p
  WHERE p.id = ANY(creator_ids)
  AND p.role IN ('teacher', 'admin');
$$;