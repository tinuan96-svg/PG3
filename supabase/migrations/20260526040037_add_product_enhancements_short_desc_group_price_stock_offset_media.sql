/*
  # Product Enhancements: Short Description, Group Pricing, Stock Display Offset, Media Library

  1. Products table additions
     - `short_description` (text) — brief summary shown in listings
     - `stock_display_offset` (integer, default 0) — subtract this from real stock before displaying
     - `group_price` (numeric) — discounted price when buying group_min_qty or more
     - `group_min_qty` (integer) — minimum quantity to qualify for group price

  2. New table: `media_library`
     - `id` (uuid PK)
     - `file_name` (text) — original filename
     - `storage_path` (text) — path in Supabase storage bucket
     - `public_url` (text) — resolved CDN URL
     - `mime_type` (text)
     - `size_bytes` (integer)
     - `uploaded_by` (uuid FK auth.users)
     - `created_at` (timestamptz)
     - RLS: authenticated admin users can manage; all can read public URLs

  3. Security
     - RLS enabled on media_library
     - Admin insert/select/delete policies
*/

-- Products: short description
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE products ADD COLUMN short_description text;
  END IF;
END $$;

-- Products: stock display offset
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_display_offset'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_display_offset integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Products: group price
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'group_price'
  ) THEN
    ALTER TABLE products ADD COLUMN group_price numeric;
  END IF;
END $$;

-- Products: group min qty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'group_min_qty'
  ) THEN
    ALTER TABLE products ADD COLUMN group_min_qty integer;
  END IF;
END $$;

-- Media library table
CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL DEFAULT '',
  storage_path text NOT NULL DEFAULT '',
  public_url text NOT NULL DEFAULT '',
  mime_type text NOT NULL DEFAULT '',
  size_bytes integer NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON media_library(created_at DESC);

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can insert media"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.profile_role = 'admin'
    )
  );

CREATE POLICY "Admin can select media"
  ON media_library FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.profile_role = 'admin'
    )
  );

CREATE POLICY "Admin can delete media"
  ON media_library FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.profile_role = 'admin'
    )
  );
