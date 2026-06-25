/*
  # Store Page Performance Indexes + RLS Fixes

  1. Missing composite indexes for store page queries
     - store_products(store_id, is_active) — primary filter for store catalog
     - products(main_category_id, is_active) — category filter
     - product_marketing_tags(store_id, product_id) — already has unique index, skip
     - product_metrics(store_id, product_id) — lookup for popularity sort

  2. RLS: product_marketing_tags and product_metrics need a public SELECT policy
     so the store page (anon/authenticated) can read tags and metrics
*/

-- store_products: composite on store_id + is_active for the primary catalog query
CREATE INDEX IF NOT EXISTS idx_store_products_store_active
  ON public.store_products(store_id, is_active)
  WHERE is_active = true;

-- products: main_category + is_active for category filter
CREATE INDEX IF NOT EXISTS idx_products_main_category_active
  ON public.products(main_category_id, is_active)
  WHERE is_active = true;

-- product_metrics: lookup by store + product for popularity sort
CREATE INDEX IF NOT EXISTS idx_product_metrics_store_product
  ON public.product_metrics(store_id, product_id);

-- RLS: allow anon/authenticated to SELECT product_marketing_tags (read-only catalog data)
CREATE POLICY "Public can view product marketing tags"
  ON public.product_marketing_tags
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS: allow anon/authenticated to SELECT product_metrics (read-only analytics)
CREATE POLICY "Public can view product metrics"
  ON public.product_metrics
  FOR SELECT
  TO anon, authenticated
  USING (true);
