-- Criar bucket para imagens de cartas
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true);

-- Criar políticas RLS para o bucket de imagens de cartas
-- Admins podem fazer upload de imagens
CREATE POLICY "Admins can upload card images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'card-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admins podem atualizar imagens
CREATE POLICY "Admins can update card images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'card-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admins podem deletar imagens
CREATE POLICY "Admins can delete card images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'card-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Qualquer pessoa pode visualizar as imagens (público)
CREATE POLICY "Anyone can view card images" ON storage.objects
FOR SELECT USING (bucket_id = 'card-images');