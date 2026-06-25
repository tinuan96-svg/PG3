/*
  # Add CentralHub Sync Fields to Products Table

  ## Purpose
  Adds metadata columns to track which products were synced from CentralHub
  (the master Supabase product source) vs created locally, and stores local
  admin customizations in a protected JSONB column that sync will never overwrite.

  ## New Columns on `products`

  - `source_product_id` (text) — the UUID from the CentralHub `products` table
  - `sync_status` (text) — 'synced' | 'local' | 'error' | 'pending'
  - `synced_at` (timestamptz) — when this product was last successfully synced
  - `local_overrides` (jsonb) — admin-set fields that survive sync rewrites:
      { title, price, description, image_url, category_id, hidden, seo_title, seo_description }

  ## New Table: `centralhub_sync_logs`

  Tracks every sync run: when, how many products, what errors.

  ## Security
  - RLS enabled on `centralhub_sync_logs`
  - Only admins (via service role or RLS policy) can write sync logs
  - Anon users can SELECT products (existing policy maintained)
*/

-- ─── 1. Add sync tracking columns to products ─────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'source_product_id'
  ) THEN
    ALTER TABLE products ADD COLUMN source_product_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sync_status'
  ) THEN
    ALTER TABLE products ADD COLUMN sync_status text DEFAULT 'local';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'synced_at'
  ) THEN
    ALTER TABLE products ADD COLUMN synced_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'local_overrides'
  ) THEN
    ALTER TABLE products ADD COLUMN local_overrides jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Index on source_product_id for fast upsert lookups
CREATE INDEX IF NOT EXISTS products_source_product_id_idx
  ON products (source_product_id)
  WHERE source_product_id IS NOT NULL;

-- Index on sync_status for admin queries
CREATE INDEX IF NOT EXISTS products_sync_status_idx
  ON products (sync_status);

-- ─── 2. Create centralhub_sync_logs table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS centralhub_sync_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by    text        NOT NULL DEFAULT 'manual',
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  products_fetched  integer   NOT NULL DEFAULT 0,
  products_inserted integer   NOT NULL DEFAULT 0,
  products_updated  integer   NOT NULL DEFAULT 0,
  products_skipped  integer   NOT NULL DEFAULT 0,
  products_failed   integer   NOT NULL DEFAULT 0,
  error_messages  text[],
  sync_source     text        NOT NULL DEFAULT 'centralhub',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE centralhub_sync_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all sync logs
CREATE POLICY "Admins can view sync logs"
  ON centralhub_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.profile_role = 'admin'
    )
  );

-- Admins can insert sync logs
CREATE POLICY "Admins can insert sync logs"
  ON centralhub_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.profile_role = 'admin'
    )
  );

-- Admins can update sync logs (to mark completed_at)
CREATE POLICY "Admins can update sync logs"
  ON centralhub_sync_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.profile_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.profile_role = 'admin'
    )
  );
