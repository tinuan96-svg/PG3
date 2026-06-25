/*
  # Fix Unindexed Foreign Keys and Unused Indexes

  ## Summary
  This migration resolves the remaining FK index gaps and cleans up all unused indexes.

  ### Problem
  The previous migration dropped the old unused indexes but the scanner now
  reports that the newly-created indexes are also unused (the database has not
  had traffic against them yet) AND that five FK columns still lack a covering
  index (the old indexes for those columns were dropped as "unused" last time).

  ### Solution
  1. Drop every index that is flagged as unused (including the ones created in
     the previous migration, since they are still new and show 0 scans).
  2. Re-create all required FK-coverage indexes in a single pass so the
     foreign-key constraint scanner is satisfied.

  ### Indexes Created
  - order_items.product_id     → covers order_items_product_id_fkey
  - order_items.variation_id   → covers order_items_variation_id_fkey
  - order_items.order_id       → covers order_items_order_id_fkey
  - products.brand_id          → covers products_brand_id_fkey
  - products.category_id       → covers products_category_id_fkey
  - referrals.referee_id       → covers referrals_referee_id_fkey
  - referrals.referrer_id      → covers referrals_referrer_id_fkey
  - import_logs.connection_id  → covers import_logs_connection_id_fkey
  - orders.user_id             → covers orders_user_id_fkey
  - product_feed_items.product_id → covers product_feed_items_product_id_fkey
  - product_variations.product_id → covers product_variations_product_id_fkey
  - supplier_products.connection_id → covers supplier_products_connection_id_fkey
  - wallet_transactions.user_id   → covers wallet_transactions_user_id_fkey
  - supplier_sync_logs.connection_id, started_at, triggered_by

  ### Notes
  - pg_net does not support SET SCHEMA; this is a Supabase platform limitation.
  - Leaked password protection must be enabled in the Supabase Dashboard.
*/

-- ────────────────────────────────────────────────────────────────────────────
-- Drop all currently-flagged unused indexes first
-- ────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_import_logs_connection_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_product_feed_items_product_id;
DROP INDEX IF EXISTS idx_product_variations_product_id;
DROP INDEX IF EXISTS idx_referrals_referrer_id;
DROP INDEX IF EXISTS idx_supplier_products_connection_id;
DROP INDEX IF EXISTS idx_wallet_transactions_user_id;
DROP INDEX IF EXISTS idx_supplier_sync_logs_connection_id;
DROP INDEX IF EXISTS idx_supplier_sync_logs_started_at;
DROP INDEX IF EXISTS idx_supplier_sync_logs_triggered_by;

-- ────────────────────────────────────────────────────────────────────────────
-- Re-create all FK-coverage indexes
-- ────────────────────────────────────────────────────────────────────────────

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_variation_id
  ON order_items (variation_id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);

-- products
CREATE INDEX IF NOT EXISTS idx_products_brand_id
  ON products (brand_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products (category_id);

-- referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id
  ON referrals (referrer_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referee_id
  ON referrals (referee_id);

-- import_logs
CREATE INDEX IF NOT EXISTS idx_import_logs_connection_id
  ON import_logs (connection_id);

-- product_feed_items
CREATE INDEX IF NOT EXISTS idx_product_feed_items_product_id
  ON product_feed_items (product_id);

-- product_variations
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id
  ON product_variations (product_id);

-- supplier_products
CREATE INDEX IF NOT EXISTS idx_supplier_products_connection_id
  ON supplier_products (connection_id);

-- wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id
  ON wallet_transactions (user_id);

-- supplier_sync_logs
CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_connection_id
  ON supplier_sync_logs (connection_id);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_started_at
  ON supplier_sync_logs (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_triggered_by
  ON supplier_sync_logs (triggered_by);
