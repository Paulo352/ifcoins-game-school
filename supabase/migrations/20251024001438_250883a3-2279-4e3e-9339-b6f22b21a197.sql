-- Criar policy para que estudantes possam ver o ranking de outros estudantes
DROP POLICY IF EXISTS "Students can view rankings" ON profiles;

CREATE POLICY "Students can view rankings"
ON profiles
FOR SELECT
USING (
  role = 'student' 
  AND has_role(auth.uid(), 'student'::app_role)
);

-- Garantir que a view rankings_secure existe com os dados corretos
DROP VIEW IF EXISTS rankings_secure CASCADE;

CREATE OR REPLACE VIEW rankings_secure AS
SELECT 
  p.id,
  p.name,
  p.coins,
  p.created_at
FROM profiles p
WHERE p.role = 'student'
ORDER BY p.coins DESC;