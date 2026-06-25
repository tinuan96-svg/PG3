/*
  # Replace OpenAI with local image processing engine

  ## Summary
  Removes all OpenAI-specific fields from the image processing pipeline and replaces
  them with local processing metadata. Adds support for multi-size outputs
  (1200px main, 600px medium, 300px thumbnail).

  ## Changes

  ### image_processing_jobs table
  - Add `processing_engine` column (text, default 'local') — replaces openai_model
  - Add `medium_url` column for the 600px intermediate size
  - Keep `openai_model` as nullable (for historical records) — set to NULL going forward

  ### image_processing_settings table
  - Add `processing_engine` column (text, default 'local')
  - Update default seed row to reflect local engine

  ### products table
  - Add `medium_image_url` column for 600px medium image if not exists

  ## Notes
  - No data is deleted — historical job records are preserved
  - New jobs will use processing_engine='local' and openai_model=NULL
*/

-- ── image_processing_jobs ────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'processing_engine'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN processing_engine text DEFAULT 'local';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'medium_url'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN medium_url text;
  END IF;
END $$;

-- Set all future rows to use local engine by default
ALTER TABLE image_processing_jobs ALTER COLUMN processing_engine SET DEFAULT 'local';

-- ── image_processing_settings ────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'processing_engine'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN processing_engine text DEFAULT 'local';
  END IF;
END $$;

-- Update the seed settings row to reflect local engine
UPDATE image_processing_settings
SET processing_engine = 'local'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ── products table ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'medium_image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN medium_image_url text;
  END IF;
END $$;

-- ── product_images table ──────────────────────────────────────────────────────
-- Ensure medium_url column exists for 600px intermediate

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_images' AND column_name = 'medium_url'
  ) THEN
    ALTER TABLE product_images ADD COLUMN medium_url text;
  END IF;
END $$;
