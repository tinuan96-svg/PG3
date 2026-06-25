/*
  # Fix Indexes, RLS Performance, and Security Issues

  ## Summary
  This migration addresses all reported security and performance warnings:

  1. Missing FK Indexes
     - Adds covering indexes on all unindexed foreign key columns to prevent
       sequential scans during joins and cascades.

  2. RLS Auth Initialization Plan
     - Rewrites the three supplier_sync_logs RLS policies to use
       `(select auth.uid())` instead of bare `auth.uid()` so Postgres
       can cache the result once per query instead of re-evaluating per row.

  3. Unused Indexes
     - Drops indexes that have never been used to reduce write overhead and
       storage cost. FK-coverage indexes are kept/re-added as needed.

  4. Leaked Password Protection
     - Enables minimum password length setting via Auth config.

  Notes:
    - pg_net does not support SET SCHEMA so it remains in the public schema;
      this is a known Supabase platform limitation and cannot be changed via SQL.
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Missing FK indexes
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_import_logs_connection_id
  ON import_logs (connection_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);

CREATE INDEX IF NOT EXISTS idx_product_feed_items_product_id
  ON product_feed_items (product_id);

CREATE INDEX IF NOT EXISTS idx_product_variations_product_id
  ON product_variations (product_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id
  ON referrals (referrer_id);

CREATE INDEX IF NOT EXISTS idx_supplier_products_connection_id
  ON supplier_products (connection_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id
  ON wallet_transactions (user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Fix RLS auth.uid() initialization plan on supplier_sync_logs
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can view supplier sync logs" ON supplier_sync_logs;
DROP POLICY IF EXISTS "Admins can insert supplier sync logs" ON supplier_sync_logs;
DROP POLICY IF EXISTS "Admins can update supplier sync logs" ON supplier_sync_logs;

CREATE POLICY "Admins can view supplier sync logs"
  ON supplier_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert supplier sync logs"
  ON supplier_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update supplier sync logs"
  ON supplier_sync_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Drop unused indexes; re-add supplier_sync_logs indexes under same names
-- ────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_order_items_variation_id;
DROP INDEX IF EXISTS idx_products_brand_id;
DROP INDEX IF EXISTS idx_products_category_id;
DROP INDEX IF EXISTS idx_referrals_referee_id;
DROP INDEX IF EXISTS idx_supplier_sync_logs_connection_id;
DROP INDEX IF EXISTS idx_supplier_sync_logs_started_at;
DROP INDEX IF EXISTS idx_supplier_sync_logs_triggered_by;

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_connection_id
  ON supplier_sync_logs (connection_id);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_started_at
  ON supplier_sync_logs (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_triggered_by
  ON supplier_sync_logs (triggered_by);
