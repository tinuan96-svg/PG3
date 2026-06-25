/*
  # Fix Security Issues: Indexes, Foreign Keys, and Security Definer View

  ## Summary
  This migration resolves all outstanding security and performance advisories.

  ## 1. Unindexed Foreign Keys — add covering indexes
  Foreign keys without indexes cause sequential scans on joins and cascades.
  New indexes added for:
  - order_items.product_id
  - order_items.variation_id
  - products.brand_id
  - products.category_id
  - referrals.referee_id

  ## 2. Unused Indexes — drop to reduce write overhead
  Unused indexes waste storage and slow down INSERT/UPDATE/DELETE operations.
  Dropped indexes:
  - idx_import_logs_connection_id
  - idx_order_items_order_id
  - idx_orders_user_id
  - idx_product_feed_items_product_id
  - idx_referrals_referrer_id
  - idx_wallet_transactions_user_id
  - idx_product_variations_product_id
  - idx_supplier_products_connection_id
  - idx_supplier_products_supplier_id
  - idx_supplier_products_normalized
  - idx_seo_pages_slug
  - idx_seo_pages_published

  ## 3. Security Definer View — recreate wallets view as SECURITY INVOKER
  The wallets view was defined with SECURITY DEFINER, meaning it ran with
  the privileges of the view owner (bypassing RLS). Recreating it without
  SECURITY DEFINER ensures it respects the calling user's RLS policies.

  ## Notes
  - All index drops use IF EXISTS for safety
  - New indexes use IF NOT EXISTS to be idempotent
  - The wallets view query is preserved exactly; only the security context changes
*/

-- =====================================================
-- SECTION 1: Add missing FK covering indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON public.order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_variation_id
  ON public.order_items (variation_id);

CREATE INDEX IF NOT EXISTS idx_products_brand_id
  ON public.products (brand_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products (category_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referee_id
  ON public.referrals (referee_id);

-- =====================================================
-- SECTION 2: Drop unused indexes
-- =====================================================

DROP INDEX IF EXISTS public.idx_import_logs_connection_id;
DROP INDEX IF EXISTS public.idx_order_items_order_id;
DROP INDEX IF EXISTS public.idx_orders_user_id;
DROP INDEX IF EXISTS public.idx_product_feed_items_product_id;
DROP INDEX IF EXISTS public.idx_referrals_referrer_id;
DROP INDEX IF EXISTS public.idx_wallet_transactions_user_id;
DROP INDEX IF EXISTS public.idx_product_variations_product_id;
DROP INDEX IF EXISTS public.idx_supplier_products_connection_id;
DROP INDEX IF EXISTS public.idx_supplier_products_supplier_id;
DROP INDEX IF EXISTS public.idx_supplier_products_normalized;
DROP INDEX IF EXISTS public.idx_seo_pages_slug;
DROP INDEX IF EXISTS public.idx_seo_pages_published;

-- =====================================================
-- SECTION 3: Recreate wallets view as SECURITY INVOKER
-- =====================================================

DROP VIEW IF EXISTS public.wallets;

CREATE VIEW public.wallets
  WITH (security_invoker = true)
  AS
  SELECT
    id,
    user_id,
    total_coins AS balance,
    updated_at
  FROM public.user_wallets;
