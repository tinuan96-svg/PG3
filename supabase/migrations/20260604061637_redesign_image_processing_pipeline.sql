/*
  # Redesign Image Processing Pipeline

  ## Summary
  Replaces the old AI-image-generation based pipeline with a pure Sharp/pixel-preserving
  pipeline. Key changes:

  1. **image_processing_jobs** — adds columns for:
     - `medium_url` (600×600 output)
     - `retry_count` (auto-retry support, max 3)
     - `next_retry_at` (delayed retry scheduling)
     - `engine` renamed alias kept, ensures 'sharp' default
     - `metadata` jsonb for OpenAI-extracted brand/weight/category/SEO data
     - `source_image_hash` to skip re-processing identical images

  2. **image_processing_settings** — adds:
     - `output_quality` (WebP quality 1–100, default 85)
     - `shadow_strength` (subtle shadow intensity, default 0.15)
     - `padding_pct` (inner padding percentage, default 10)
     - `bg_threshold` (background detection threshold, default 30)
     - `max_retries` (max retry attempts, default 3)
     - `enable_openai_metadata` (flag for OpenAI brand/weight extraction, default false)
     - `openai_fields` (which fields to extract: brand, weight, category, seo)

  3. **RPC: get_image_processing_stats()** — summary counts by status for dashboard

  4. **RPC: enqueue_image_processing_jobs(p_limit int)** — bulk-enqueues pending
     products that have images but haven't been processed yet

  5. **RPC: retry_failed_image_jobs()** — resets failed jobs for retry

  ## Security
  - All tables have RLS enabled
  - Admin-only write; authenticated read
*/

-- ── image_processing_jobs: add missing columns ────────────────────────────────

DO $$
BEGIN
  -- medium_url: 600x600 WebP output
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'medium_url'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN medium_url TEXT;
  END IF;

  -- retry_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- next_retry_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'next_retry_at'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN next_retry_at TIMESTAMPTZ;
  END IF;

  -- metadata (OpenAI extracted fields, settings snapshot)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN metadata JSONB;
  END IF;

  -- source_image_hash: SHA-256 of source image bytes for deduplication
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'source_image_hash'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN source_image_hash TEXT;
  END IF;

  -- pipeline_stage default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'processing_engine'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN processing_engine TEXT NOT NULL DEFAULT 'sharp';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_retry_at
  ON image_processing_jobs(next_retry_at)
  WHERE status = 'failed';

-- ── image_processing_settings: add new config columns ────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'output_quality'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN output_quality INTEGER NOT NULL DEFAULT 85;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'shadow_strength'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN shadow_strength NUMERIC NOT NULL DEFAULT 0.15;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'padding_pct'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN padding_pct INTEGER NOT NULL DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'bg_threshold'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN bg_threshold INTEGER NOT NULL DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'max_retries'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN max_retries INTEGER NOT NULL DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'enable_openai_metadata'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN enable_openai_metadata BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'openai_fields'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN openai_fields TEXT[] NOT NULL DEFAULT ARRAY['brand', 'weight', 'category', 'seo'];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'main_size_px'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN main_size_px INTEGER NOT NULL DEFAULT 1200;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'medium_size_px'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN medium_size_px INTEGER NOT NULL DEFAULT 600;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_settings' AND column_name = 'thumb_size_px'
  ) THEN
    ALTER TABLE image_processing_settings ADD COLUMN thumb_size_px INTEGER NOT NULL DEFAULT 300;
  END IF;
END $$;

-- Ensure settings row exists with new defaults
INSERT INTO image_processing_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ── RPC: get_image_processing_stats ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_image_processing_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'pending',    COUNT(*) FILTER (WHERE status = 'pending'),
    'processing', COUNT(*) FILTER (WHERE status = 'processing'),
    'completed',  COUNT(*) FILTER (WHERE status = 'completed'),
    'failed',     COUNT(*) FILTER (WHERE status = 'failed'),
    'total',      COUNT(*),
    'avg_duration_ms', ROUND(AVG(duration_ms) FILTER (WHERE status = 'completed'))::int
  )
  INTO v_result
  FROM image_processing_jobs;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_image_processing_stats() TO authenticated;

-- ── RPC: enqueue_image_processing_jobs ───────────────────────────────────────

CREATE OR REPLACE FUNCTION enqueue_image_processing_jobs(p_limit INT DEFAULT 100)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  r RECORD;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR r IN
    SELECT p.id AS product_id, p.image AS image_url
    FROM products p
    WHERE p.image IS NOT NULL
      AND trim(p.image) != ''
      AND p.image NOT LIKE '%supabase%/storage%'  -- skip already-processed images
      AND NOT EXISTS (
        SELECT 1 FROM image_processing_jobs j
        WHERE j.product_id = p.id
          AND j.status IN ('pending', 'processing', 'completed')
      )
    ORDER BY p.created_at DESC
    LIMIT p_limit
  LOOP
    INSERT INTO image_processing_jobs (product_id, original_url, status, processing_engine)
    VALUES (r.product_id, r.image_url, 'pending', 'sharp')
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION enqueue_image_processing_jobs(int) TO authenticated;

-- ── RPC: retry_failed_image_jobs ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION retry_failed_image_jobs(p_max_retries INT DEFAULT 3)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE image_processing_jobs
  SET
    status      = 'pending',
    error_message = NULL,
    next_retry_at = NULL,
    updated_at    = now()
  WHERE status = 'failed'
    AND retry_count < p_max_retries;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION retry_failed_image_jobs(int) TO authenticated;

-- Add updated_at to jobs table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_processing_jobs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE image_processing_jobs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;
