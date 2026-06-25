/*
  # Sync Performance Indexes and Webhook Logs

  ## Summary
  Adds performance indexes for the product sync architecture and a dedicated
  table for tracking incoming CentralHub webhook events and sync run history.

  ## New Tables

  ### centralhub_sync_logs
  Tracks every sync run (webhook, scheduled, manual):
  - `id` (uuid, pk)
  - `triggered_by` — 'webhook' | 'scheduled' | 'manual'
  - `status` — 'running' | 'success' | 'partial' | 'failed'
  - `products_synced` — count of successfully upserted products
  - `products_failed` — count of failed upserts
  - `products_skipped` — count of unchanged products
  - `error_message` — top-level error if run failed
  - `started_at`, `completed_at` — timing

  ### sync_webhook_events
  Audit log of every incoming CentralHub webhook payload:
  - `id` (uuid, pk)
  - `event_type` — e.g. 'product.updated'
  - `centralhub_product_id` — the product ID from CentralHub
  - `payload` — full JSON payload
  - `processed`, `error_message`, `received_at`, `processed_at`

  ## New Indexes
  - `products.source_product_id` (WHERE NOT NULL)
  - `products.sku` (WHERE NOT NULL)
  - `products.approval_status`
  - `products.needs_admin_review` (WHERE true)

  ## Security
  - RLS enabled on both new tables
  - Admin-only read access via profiles.role check
  - Service role write access for sync operations
*/

-- ─── centralhub_sync_logs ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS centralhub_sync_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by      text NOT NULL DEFAULT 'manual',
  status            text NOT NULL DEFAULT 'running',
  products_synced   integer NOT NULL DEFAULT 0,
  products_failed   integer NOT NULL DEFAULT 0,
  products_skipped  integer NOT NULL DEFAULT 0,
  error_message     text,
  started_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,
  metadata          jsonb
);

ALTER TABLE centralhub_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_centralhub_sync_logs_started_at
  ON centralhub_sync_logs (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_centralhub_sync_logs_triggered_by
  ON centralhub_sync_logs (triggered_by);

CREATE INDEX IF NOT EXISTS idx_centralhub_sync_logs_status
  ON centralhub_sync_logs (status);

CREATE POLICY "Admins can view sync logs"
  ON centralhub_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage sync logs"
  ON centralhub_sync_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update sync logs"
  ON centralhub_sync_logs FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── sync_webhook_events ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sync_webhook_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type              text NOT NULL DEFAULT 'product.updated',
  centralhub_product_id   text,
  payload                 jsonb,
  processed               boolean NOT NULL DEFAULT false,
  error_message           text,
  received_at             timestamptz NOT NULL DEFAULT now(),
  processed_at            timestamptz
);

ALTER TABLE sync_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sync_webhook_events_received_at
  ON sync_webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_webhook_events_unprocessed
  ON sync_webhook_events (processed)
  WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_sync_webhook_events_product_id
  ON sync_webhook_events (centralhub_product_id)
  WHERE centralhub_product_id IS NOT NULL;

CREATE POLICY "Admins can view webhook events"
  ON sync_webhook_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert webhook events"
  ON sync_webhook_events FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update webhook events"
  ON sync_webhook_events FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── Products sync performance indexes ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_source_product_id
  ON products (source_product_id)
  WHERE source_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_sku_sync
  ON products (sku)
  WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_approval_status
  ON products (approval_status);

CREATE INDEX IF NOT EXISTS idx_products_needs_admin_review
  ON products (needs_admin_review)
  WHERE needs_admin_review = true;
