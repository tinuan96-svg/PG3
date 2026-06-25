/*
  # Fix Security Issues: Indexes and RLS Policies

  ## Summary
  Addresses all flagged security and performance issues:

  ## 1. Add Missing Index
  - `product_feed_items.product_id` foreign key now has a covering index to prevent slow lookups

  ## 2. Drop Unused Indexes
  Removes indexes that have never been used (wasted storage and write overhead):
  - `idx_products_category` on products(category_id)
  - `idx_products_brand` on products(brand_id)
  - `idx_products_updated` on products(updated_at)
  - `idx_products_featured` on products(is_featured)
  - `idx_seo_logs_path` on seo_page_logs(page_path)
  - `idx_seo_logs_type` on seo_page_logs(page_type)
  - `idx_seo_logs_created` on seo_page_logs(created_at)

  ## 3. Fix Always-True RLS Policies
  Replaces policies that allowed unrestricted authenticated access with properly scoped ones:

  ### product_feed_items
  - INSERT: restricted to admin users only (checks role in public.users)
  - UPDATE: restricted to admin users only (USING + WITH CHECK)

  ### seo_page_logs
  - INSERT: requires page_path to be non-empty (prevents blank log spam)
  - UPDATE: restricted to admin users only

  ## Security Notes
  - Admin role is checked via `public.users.role = 'admin'` using `auth.uid()`
  - Non-admin authenticated users retain SELECT access where applicable
*/

-- =====================================================
-- 1. ADD MISSING INDEX FOR FOREIGN KEY
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_feed_items_product_id
  ON product_feed_items(product_id);

-- =====================================================
-- 2. DROP UNUSED INDEXES
-- =====================================================
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_brand;
DROP INDEX IF EXISTS idx_products_updated;
DROP INDEX IF EXISTS idx_products_featured;
DROP INDEX IF EXISTS idx_seo_logs_path;
DROP INDEX IF EXISTS idx_seo_logs_type;
DROP INDEX IF EXISTS idx_seo_logs_created;

-- =====================================================
-- 3. FIX product_feed_items RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Feed items writable by authenticated" ON product_feed_items;
DROP POLICY IF EXISTS "Feed items updatable by authenticated" ON product_feed_items;

CREATE POLICY "Admin users can insert feed items"
  ON product_feed_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin users can update feed items"
  ON product_feed_items
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- =====================================================
-- 4. FIX seo_page_logs RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can insert SEO logs" ON seo_page_logs;
DROP POLICY IF EXISTS "Authenticated users can update SEO logs" ON seo_page_logs;

CREATE POLICY "Authenticated users can insert SEO logs"
  ON seo_page_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    page_path IS NOT NULL AND length(page_path) > 0
  );

CREATE POLICY "Admin users can update SEO logs"
  ON seo_page_logs
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
