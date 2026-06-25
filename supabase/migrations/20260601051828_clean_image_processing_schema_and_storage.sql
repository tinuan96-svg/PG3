/*
  # Clean up image processing schema and ensure storage bucket

  ## Changes

  1. image_processing_jobs table
     - Drop `openai_model` column — no longer used, pipeline is fully local (Sharp-based)
     - Add `medium_url` column — stores the 600×600 processed image URL
     - Add `processing_engine` column if missing — records which engine ran ('sharp' | 'canvas')

  2. Storage
     - Ensure `product-images` bucket exists (public, 20 MB limit)
     - Ensure public read policy exists for the bucket
     - Ensure authenticated upload policy exists
*/

DO $$
BEGIN
  -- Drop openai_model — never populated, pipeline is 100% local
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'openai_model'
  ) THEN
    ALTER TABLE image_processing_jobs DROP COLUMN openai_model;
  END IF;

  -- Add medium_url for 600×600 tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'medium_url'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN medium_url TEXT;
  END IF;

  -- Add processing_engine (tracks 'sharp' vs 'canvas')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'processing_engine'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN processing_engine TEXT DEFAULT 'sharp';
  END IF;
END $$;

-- Ensure product-images storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520;

-- Public read access (storefront needs to display product images)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Product images public read'
  ) THEN
    CREATE POLICY "Product images public read"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Authenticated users can upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Authenticated users can upload product images'
  ) THEN
    CREATE POLICY "Authenticated users can upload product images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'product-images');
  END IF;
END $$;

-- Admins can delete product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Admins can delete product images'
  ) THEN
    CREATE POLICY "Admins can delete product images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-images'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;
