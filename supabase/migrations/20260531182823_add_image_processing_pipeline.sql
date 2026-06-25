/*
  # Image Processing Pipeline

  Adds full image standardization infrastructure:

  1. Modified Tables
    - `product_images`
      - `original_url` (TEXT) — copy of the URL before any processing
      - `processed_url` (TEXT) — AI-processed white-background URL
      - `thumbnail_url` (TEXT) — 400×400 optimised URL
      - `processing_status` (TEXT) — none | processing | completed | failed
      - `processing_error` (TEXT) — error message if failed
      - `processed_at` (TIMESTAMPTZ) — when processing completed

    - `products`
      - `original_image_url` (TEXT) — original primary image URL
      - `processed_image_url` (TEXT) — AI-processed primary image URL
      - `thumbnail_url` (TEXT) — thumbnail of primary image

  2. New Tables
    - `image_processing_settings` — site-wide processing configuration (single row)
    - `image_processing_jobs` — async job queue with full audit trail

  3. Security
    - RLS enabled on all new tables
    - Admin-only write access; authenticated read access
*/

/* ─── product_images: add processing columns ─────────────────────────── */
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_images' AND column_name = 'original_url') THEN
    ALTER TABLE product_images ADD COLUMN original_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_images' AND column_name = 'processed_url') THEN
    ALTER TABLE product_images ADD COLUMN processed_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_images' AND column_name = 'thumbnail_url') THEN
    ALTER TABLE product_images ADD COLUMN thumbnail_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_images' AND column_name = 'processing_status') THEN
    ALTER TABLE product_images ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'none';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_images' AND column_name = 'processing_error') THEN
    ALTER TABLE product_images ADD COLUMN processing_error TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_images' AND column_name = 'processed_at') THEN
    ALTER TABLE product_images ADD COLUMN processed_at TIMESTAMPTZ;
  END IF;
END $$;

/* ─── products: add image processing columns ──────────────────────────── */
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'original_image_url') THEN
    ALTER TABLE products ADD COLUMN original_image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'processed_image_url') THEN
    ALTER TABLE products ADD COLUMN processed_image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'thumbnail_url') THEN
    ALTER TABLE products ADD COLUMN thumbnail_url TEXT;
  END IF;
END $$;

/* ─── image_processing_settings ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS image_processing_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_process_on_upload   BOOLEAN NOT NULL DEFAULT true,
  generate_white_background BOOLEAN NOT NULL DEFAULT true,
  generate_thumbnail       BOOLEAN NOT NULL DEFAULT true,
  keep_original            BOOLEAN NOT NULL DEFAULT true,
  replace_storefront_image BOOLEAN NOT NULL DEFAULT true,
  min_image_size_kb        INTEGER NOT NULL DEFAULT 10,
  min_dimension_px         INTEGER NOT NULL DEFAULT 100,
  output_size_px           INTEGER NOT NULL DEFAULT 1024,
  thumbnail_size_px        INTEGER NOT NULL DEFAULT 400,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by               UUID REFERENCES auth.users(id)
);

ALTER TABLE image_processing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read image processing settings"
  ON image_processing_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'content_manager')
    )
  );

CREATE POLICY "Admin can insert image processing settings"
  ON image_processing_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update image processing settings"
  ON image_processing_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

/* Seed default settings row */
INSERT INTO image_processing_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

/* ─── image_processing_jobs ───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS image_processing_jobs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID REFERENCES products(id) ON DELETE CASCADE,
  product_image_id      UUID,
  original_url          TEXT NOT NULL,
  processed_url         TEXT,
  thumbnail_url         TEXT,
  status                TEXT NOT NULL DEFAULT 'pending',
  pipeline_stage        TEXT,
  error_message         TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  duration_ms           INTEGER,
  openai_model          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_product_id    ON image_processing_jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_status        ON image_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_created_at    ON image_processing_jobs(created_at DESC);

ALTER TABLE image_processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read image processing jobs"
  ON image_processing_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'content_manager')
    )
  );

CREATE POLICY "Admin can insert image processing jobs"
  ON image_processing_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'content_manager')
    )
  );

CREATE POLICY "Admin can update image processing jobs"
  ON image_processing_jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'content_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'content_manager')
    )
  );
