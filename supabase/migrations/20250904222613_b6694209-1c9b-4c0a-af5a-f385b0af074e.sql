-- Ensure public bucket for card images and policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'card-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('card-images', 'card-images', true);
  ELSE
    -- Ensure it's public
    UPDATE storage.buckets SET public = true WHERE id = 'card-images';
  END IF;
END $$;

-- Public can read images from card-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read card images'
  ) THEN
    CREATE POLICY "Public read card images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'card-images');
  END IF;
END $$;
$$;

-- Authenticated users can upload to card-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload card images'
  ) THEN
    CREATE POLICY "Authenticated upload card images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'card-images');
  END IF;
END $$;
$$;

-- Authenticated users can update/delete (optional; used by admin UI)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated modify card images'
  ) THEN
    CREATE POLICY "Authenticated modify card images"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'card-images')
    WITH CHECK (bucket_id = 'card-images');
  END IF;
END $$;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated delete card images'
  ) THEN
    CREATE POLICY "Authenticated delete card images"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'card-images');
  END IF;
END $$;
$$;