/*
  # AI Content Generation Queue System

  1. New Tables
    - `ai_content_queue`
      - `id` (uuid, PK)
      - `product_id` (uuid, FK → products)
      - `action` (text) — 'short_description'|'full_description'|'seo'|'everything'
      - `status` (text) — 'pending'|'processing'|'completed'|'failed'
      - `retry_count` (int, default 0)
      - `error_message` (text, nullable)
      - `triggered_by` (uuid, FK → auth.users)
      - `batch_id` (uuid, nullable)
      - `generated_fields` (jsonb, nullable)
      - timestamps

  2. RPCs (SECURITY DEFINER via is_admin())
    - `enqueue_ai_content_jobs` — insert pending jobs, skip in-progress duplicates
    - `get_ai_content_queue_stats` — counts by status (optionally scoped to batch)
    - `retry_failed_ai_jobs` — reset failed → pending
    - `reset_stale_ai_jobs` — reset stuck processing jobs (>5 min) back to pending

  3. Security
    - RLS enabled; admin-only policies via user_profiles
*/

-- ── Table ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_content_queue (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  action           text NOT NULL DEFAULT 'everything'
                   CHECK (action IN ('short_description','full_description','seo','everything')),
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','processing','completed','failed')),
  retry_count      int  NOT NULL DEFAULT 0,
  error_message    text,
  triggered_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  batch_id         uuid,
  generated_fields jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  started_at       timestamptz,
  completed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ai_content_queue_status     ON ai_content_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_content_queue_product_id ON ai_content_queue(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_queue_batch_id   ON ai_content_queue(batch_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_queue_created_at ON ai_content_queue(created_at DESC);

ALTER TABLE ai_content_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can select ai_content_queue"
  ON ai_content_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert ai_content_queue"
  ON ai_content_queue FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update ai_content_queue"
  ON ai_content_queue FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── Enqueue jobs ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION enqueue_ai_content_jobs(
  p_product_ids uuid[],
  p_action      text DEFAULT 'everything',
  p_batch_id    uuid DEFAULT gen_random_uuid()
)
RETURNS TABLE (enqueued int, batch_id uuid)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_count int := 0;
  v_pid   uuid;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  FOREACH v_pid IN ARRAY p_product_ids LOOP
    IF NOT EXISTS (
      SELECT 1 FROM ai_content_queue
      WHERE product_id = v_pid
        AND action     = p_action
        AND status IN ('pending','processing')
    ) THEN
      INSERT INTO ai_content_queue (product_id, action, batch_id, triggered_by)
      VALUES (v_pid, p_action, p_batch_id, auth.uid());
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_count, p_batch_id;
END;
$$;

GRANT EXECUTE ON FUNCTION enqueue_ai_content_jobs(uuid[], text, uuid) TO authenticated;

-- ── Queue stats ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_ai_content_queue_stats(
  p_batch_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total        bigint,
  pending      bigint,
  processing   bigint,
  completed    bigint,
  failed       bigint,
  last_updated timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  RETURN QUERY
  SELECT
    COUNT(*)                                          AS total,
    COUNT(*) FILTER (WHERE status = 'pending')        AS pending,
    COUNT(*) FILTER (WHERE status = 'processing')     AS processing,
    COUNT(*) FILTER (WHERE status = 'completed')      AS completed,
    COUNT(*) FILTER (WHERE status = 'failed')         AS failed,
    MAX(COALESCE(completed_at, started_at, created_at)) AS last_updated
  FROM ai_content_queue
  WHERE (p_batch_id IS NULL OR batch_id = p_batch_id);
END;
$$;

GRANT EXECUTE ON FUNCTION get_ai_content_queue_stats(uuid) TO authenticated;

-- ── Retry failed ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION retry_failed_ai_jobs(
  p_batch_id uuid DEFAULT NULL
)
RETURNS int
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE v_count int;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  UPDATE ai_content_queue
  SET status        = 'pending',
      error_message = NULL,
      started_at    = NULL,
      completed_at  = NULL
  WHERE status = 'failed'
    AND (p_batch_id IS NULL OR batch_id = p_batch_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION retry_failed_ai_jobs(uuid) TO authenticated;

-- ── Reset stale processing jobs ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reset_stale_ai_jobs()
RETURNS int
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE v_count int;
BEGIN
  UPDATE ai_content_queue
  SET status     = 'pending',
      started_at = NULL
  WHERE status = 'processing'
    AND started_at < now() - interval '5 minutes';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_stale_ai_jobs() TO authenticated;
