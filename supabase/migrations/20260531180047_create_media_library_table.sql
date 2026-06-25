/*
  # Media Library and Product Image Management

  ## New Tables
  - `media_library` — tracks uploaded files in the product-images Storage bucket
    - id, file_name, storage_path, public_url, mime_type, size_bytes, uploaded_by, created_at

  ## Modified Tables
  - `product_images` — adds storage_path and alt_text columns if missing

  ## Security
  - RLS on media_library with admin role check via user_profiles.role
*/

-- Create media_library table
CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text DEFAULT 'image/jpeg',
  size_bytes bigint DEFAULT 0,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON media_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);

-- Admins can view all media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_library' AND policyname = 'Admins can view all media'
  ) THEN
    CREATE POLICY "Admins can view all media"
      ON media_library FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Admins can insert media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_library' AND policyname = 'Admins can insert media'
  ) THEN
    CREATE POLICY "Admins can insert media"
      ON media_library FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Admins can delete media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_library' AND policyname = 'Admins can delete media'
  ) THEN
    CREATE POLICY "Admins can delete media"
      ON media_library FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Ensure product_images has needed columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_images' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE product_images ADD COLUMN storage_path text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_images' AND column_name = 'alt_text'
  ) THEN
    ALTER TABLE product_images ADD COLUMN alt_text text;
  END IF;
END $$;
