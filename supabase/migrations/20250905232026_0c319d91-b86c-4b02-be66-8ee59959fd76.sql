-- Verificar configurações do bucket card-images
SELECT * FROM storage.buckets WHERE id = 'card-images';

-- Atualizar configurações do bucket para permitir uploads e downloads otimizados
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 5242880, -- 5MB em bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'card-images';

-- Garantir que as políticas estejam corretas para o bucket
-- Política para visualização pública (já existe mas vamos garantir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Public read access for card images'
  ) THEN
    CREATE POLICY "Public read access for card images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'card-images');
  END IF;
END $$;

-- Política para upload autenticado (melhorada)
DROP POLICY IF EXISTS "Authenticated upload card images" ON storage.objects;
CREATE POLICY "Authenticated upload card images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'card-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
  OR auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role IN ('admin', 'teacher')
  )
);

-- Política para atualização de imagens
DROP POLICY IF EXISTS "Authenticated modify card images" ON storage.objects;
CREATE POLICY "Authenticated modify card images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'card-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'teacher')
    )
  )
);

-- Política para deleção de imagens  
DROP POLICY IF EXISTS "Authenticated delete card images" ON storage.objects;
CREATE POLICY "Authenticated delete card images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'card-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'teacher')
    )
  )
);