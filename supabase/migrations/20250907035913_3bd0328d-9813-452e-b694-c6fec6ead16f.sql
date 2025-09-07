-- Criar bucket de backups
INSERT INTO storage.buckets (id, name, public) 
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir que admins visualizem objetos do bucket 'backups'
CREATE POLICY "Admins can view backups"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'backups' AND get_current_user_role() = 'admin'
);

-- Política para permitir que admins insiram objetos (para backup)
CREATE POLICY "Admins can upload backups"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'backups' AND get_current_user_role() = 'admin'
);

-- Política para permitir que admins deletem objetos
CREATE POLICY "Admins can delete backups"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'backups' AND get_current_user_role() = 'admin'
);