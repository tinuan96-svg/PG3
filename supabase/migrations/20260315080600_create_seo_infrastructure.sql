/*
  # SEO Infrastructure Migration

  ## Summary
  Creates the complete SEO infrastructure for PocketGrocery including:
  - Products table with full SEO fields (for WooCommerce sync)
  - Categories table with SEO fields
  - Brands table
  - seo_page_logs for programmatic page tracking
  - product_feeds table for social media feed management

  ## Tables Created
  1. `categories` - Product categories with SEO fields
  2. `brands` - Product brands
  3. `products` - Full product catalog with comprehensive SEO fields
  4. `seo_page_logs` - Tracks programmatic SEO page performance
  5. `product_feed_items` - Cached product feed data for social platforms

  ## Security
  - RLS enabled on all tables
  - Public SELECT policies for products/categories/brands
  - Authenticated-only for seo_page_logs
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  seo_title text,
  seo_description text,
  meta_keywords text,
  image_url text,
  og_image text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Categories are publicly readable'
  ) THEN
    EXECUTE 'CREATE POLICY "Categories are publicly readable" ON categories FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  logo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname = 'Brands are publicly readable'
  ) THEN
    EXECUTE 'CREATE POLICY "Brands are publicly readable" ON brands FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text DEFAULT '',
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id),
  brand_id uuid REFERENCES brands(id),
  price numeric(10,2) NOT NULL DEFAULT 0,
  offer_price numeric(10,2),
  weight text DEFAULT '',
  stock_quantity integer DEFAULT 0,
  stock_status text DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'backorder')),
  coin_reward integer DEFAULT 0,
  images jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  seo_title text,
  seo_description text,
  meta_title text,
  meta_description text,
  meta_keywords text,
  canonical_url text,
  og_image text,
  is_featured boolean DEFAULT false,
  search_volume integer DEFAULT 0,
  woocommerce_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Products are publicly readable'
  ) THEN
    EXECUTE 'CREATE POLICY "Products are publicly readable" ON products FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;

CREATE TABLE IF NOT EXISTS seo_page_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  page_type text NOT NULL DEFAULT 'product',
  product_slug text,
  location text,
  views integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seo_page_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'seo_page_logs' AND policyname = 'Authenticated users can manage SEO logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can manage SEO logs" ON seo_page_logs FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "Authenticated users can insert SEO logs" ON seo_page_logs FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Authenticated users can update SEO logs" ON seo_page_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_seo_logs_path ON seo_page_logs(page_path);
CREATE INDEX IF NOT EXISTS idx_seo_logs_type ON seo_page_logs(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_logs_created ON seo_page_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS product_feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('google', 'facebook', 'instagram', 'pinterest', 'tiktok')),
  feed_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_feed_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_feed_items' AND policyname = 'Feed items readable by authenticated'
  ) THEN
    EXECUTE 'CREATE POLICY "Feed items readable by authenticated" ON product_feed_items FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "Feed items writable by authenticated" ON product_feed_items FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Feed items updatable by authenticated" ON product_feed_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;
