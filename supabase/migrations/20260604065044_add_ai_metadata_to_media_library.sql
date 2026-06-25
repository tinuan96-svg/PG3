/*
  # AI Metadata Upgrade for Media Library

  ## Summary
  Extends the media_library table with AI-extracted metadata fields to support
  OpenAI Vision-based auto-classification of product images.

  ## New Columns on media_library
  - `display_name`      — Human-readable product name (e.g. "Double Horse Corn Puttu Podi 500g")
  - `seo_filename`      — SEO-optimised filename slug (e.g. "double-horse-corn-puttu-podi-500g.webp")
  - `brand`             — Extracted brand name (e.g. "Double Horse")
  - `product_name`      — Extracted product name without brand/weight
  - `weight`            — Weight string extracted from packaging (e.g. "500g", "5kg")
  - `category`          — Product category (e.g. "Flours", "Spices")
  - `keywords`          — Array of SEO keywords
  - `alt_text`          — Generated image alt text for SEO
  - `title`             — Generated image title
  - `description`       — Generated image description
  - `confidence_score`  — AI confidence 0–100
  - `ai_status`         — 'pending' | 'processing' | 'completed' | 'failed'
  - `ai_error`          — Error message if AI processing failed
  - `ai_processed_at`   — When AI analysis was last run
  - `is_duplicate`      — Flag if a near-duplicate was detected
  - `duplicate_of`      — FK to the preferred version

  ## New Table: media_ai_queue
  Background queue for AI processing of media images.
  - id, media_id (FK), status, retry_count, error_message, batch_id, created_at, started_at, completed_at

  ## New RPCs
  - `get_media_ai_stats()` — counts by ai_status, duplicates, avg confidence
  - `enqueue_media_ai_jobs(p_media_ids uuid[])` — add to queue skipping duplicates
  - `retry_failed_media_ai_jobs()` — reset failed jobs to pending
*/

-- ── Extend media_library ───────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'display_name') THEN
    ALTER TABLE media_library ADD COLUMN display_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'seo_filename') THEN
    ALTER TABLE media_library ADD COLUMN seo_filename text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'brand') THEN
    ALTER TABLE media_library ADD COLUMN brand text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'product_name') THEN
    ALTER TABLE media_library ADD COLUMN product_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'weight') THEN
    ALTER TABLE media_library ADD COLUMN weight text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'category') THEN
    ALTER TABLE media_library ADD COLUMN category text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'keywords') THEN
    ALTER TABLE media_library ADD COLUMN keywords text[] DEFAULT ARRAY[]::text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'alt_text') THEN
    ALTER TABLE media_library ADD COLUMN alt_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'title') THEN
    ALTER TABLE media_library ADD COLUMN title text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'description') THEN
    ALTER TABLE media_library ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'confidence_score') THEN
    ALTER TABLE media_library ADD COLUMN confidence_score int CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'ai_status') THEN
    ALTER TABLE media_library ADD COLUMN ai_status text NOT NULL DEFAULT 'pending'
      CHECK (ai_status IN ('pending','processing','completed','failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'ai_error') THEN
    ALTER TABLE media_library ADD COLUMN ai_error text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'ai_processed_at') THEN
    ALTER TABLE media_library ADD COLUMN ai_processed_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'is_duplicate') THEN
    ALTER TABLE media_library ADD COLUMN is_duplicate bool NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'duplicate_of') THEN
    ALTER TABLE media_library ADD COLUMN duplicate_of uuid REFERENCES media_library(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Mark existing rows as pending
UPDATE media_library SET ai_status = 'pending' WHERE ai_status = 'pending';

-- Index for AI status queries
CREATE INDEX IF NOT EXISTS idx_media_library_ai_status ON media_library(ai_status);
CREATE INDEX IF NOT EXISTS idx_media_library_brand      ON media_library(brand);
CREATE INDEX IF NOT EXISTS idx_media_library_category   ON media_library(category);

-- ── Media AI queue table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_ai_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id      uuid NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','processing','completed','failed')),
  retry_count   int  NOT NULL DEFAULT 0,
  error_message text,
  batch_id      uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  completed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_media_ai_queue_status   ON media_ai_queue(status);
CREATE INDEX IF NOT EXISTS idx_media_ai_queue_media_id ON media_ai_queue(media_id);

ALTER TABLE media_ai_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can select media_ai_queue"
  ON media_ai_queue FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin')));

CREATE POLICY "Admin can insert media_ai_queue"
  ON media_ai_queue FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin')));

CREATE POLICY "Admin can update media_ai_queue"
  ON media_ai_queue FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin')));

-- ── RPC: get_media_ai_stats ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_media_ai_stats()
RETURNS TABLE (
  total        bigint,
  pending      bigint,
  processing   bigint,
  completed    bigint,
  failed       bigint,
  duplicates   bigint,
  avg_confidence numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT
    COUNT(*)                                          AS total,
    COUNT(*) FILTER (WHERE ai_status = 'pending')    AS pending,
    COUNT(*) FILTER (WHERE ai_status = 'processing') AS processing,
    COUNT(*) FILTER (WHERE ai_status = 'completed')  AS completed,
    COUNT(*) FILTER (WHERE ai_status = 'failed')     AS failed,
    COUNT(*) FILTER (WHERE is_duplicate = true)      AS duplicates,
    ROUND(AVG(confidence_score) FILTER (WHERE confidence_score IS NOT NULL), 1) AS avg_confidence
  FROM media_library;
END;
$$;

GRANT EXECUTE ON FUNCTION get_media_ai_stats() TO authenticated;

-- ── RPC: enqueue_media_ai_jobs ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION enqueue_media_ai_jobs(
  p_media_ids uuid[]
)
RETURNS int
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_count int := 0;
  v_id    uuid;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  FOREACH v_id IN ARRAY p_media_ids LOOP
    IF NOT EXISTS (
      SELECT 1 FROM media_ai_queue
      WHERE media_id = v_id AND status IN ('pending','processing')
    ) THEN
      INSERT INTO media_ai_queue (media_id) VALUES (v_id);
      UPDATE media_library SET ai_status = 'pending' WHERE id = v_id;
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION enqueue_media_ai_jobs(uuid[]) TO authenticated;

-- ── RPC: retry_failed_media_ai_jobs ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION retry_failed_media_ai_jobs()
RETURNS int
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE v_count int;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  UPDATE media_ai_queue
  SET status        = 'pending',
      error_message = NULL,
      started_at    = NULL,
      completed_at  = NULL
  WHERE status = 'failed';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE media_library SET ai_status = 'pending'
  WHERE id IN (SELECT media_id FROM media_ai_queue WHERE status = 'pending');

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION retry_failed_media_ai_jobs() TO authenticated;
