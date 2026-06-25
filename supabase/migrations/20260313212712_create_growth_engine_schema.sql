/*
  # Growth Engine Schema - WooCommerce Integration & Growth Systems

  ## Overview
  This migration creates the complete Growth Engine system for PocketGrocery.com including:
  - WooCommerce product synchronization
  - Smart product bundles
  - Cross-sell recommendations
  - Analytics tracking
  - Add-on suggestions

  ## New Tables

  ### 1. `woocommerce_products`
  Stores synced products from WooCommerce REST API
  - `id` (uuid, primary key)
  - `wc_product_id` (bigint, unique) - WooCommerce product ID
  - `name` (text) - Product name
  - `slug` (text, unique) - Product slug
  - `description` (text) - Full description
  - `short_description` (text) - Short description
  - `images` (jsonb) - Array of image URLs
  - `category_ids` (bigint[]) - WooCommerce category IDs
  - `brand` (text) - Brand name
  - `price` (decimal) - Regular price
  - `sale_price` (decimal) - Sale price
  - `stock_quantity` (integer) - Stock quantity
  - `stock_status` (text) - in_stock, out_of_stock, on_backorder
  - `weight` (text) - Product weight
  - `tags` (text[]) - Product tags
  - `coin_reward` (integer) - Pocket coins reward
  - `last_synced_at` (timestamptz) - Last sync timestamp
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `product_bundles`
  Product bundle definitions for increasing order value
  - `id` (uuid, primary key)
  - `name` (text) - Bundle name
  - `slug` (text, unique) - URL-friendly slug
  - `description` (text) - Bundle description
  - `image_url` (text) - Bundle image
  - `product_ids` (uuid[]) - Array of product IDs in bundle
  - `original_price` (decimal) - Sum of original prices
  - `bundle_price` (decimal) - Discounted bundle price
  - `savings_amount` (decimal) - Calculated savings
  - `coin_reward` (integer) - Total coins for bundle
  - `is_active` (boolean) - Enable/disable bundle
  - `display_locations` (text[]) - homepage, product_page, cart
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `cross_sell_rules`
  AI and manual cross-sell recommendation rules
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key) - Source product
  - `recommended_product_id` (uuid, foreign key) - Recommended product
  - `rule_type` (text) - category_similarity, purchase_history, manual
  - `priority` (integer) - Display priority
  - `conversion_rate` (decimal) - Track effectiveness
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 4. `growth_analytics`
  Track growth engine performance
  - `id` (uuid, primary key)
  - `event_type` (text) - bundle_view, bundle_purchase, cross_sell_click, cross_sell_purchase, upsell_view, upsell_purchase
  - `product_id` (uuid) - Product involved
  - `bundle_id` (uuid) - Bundle involved
  - `user_id` (uuid) - User if authenticated
  - `session_id` (text) - Anonymous session tracking
  - `revenue_impact` (decimal) - Revenue from this event
  - `metadata` (jsonb) - Additional event data
  - `created_at` (timestamptz)

  ### 5. `sync_logs`
  Track WooCommerce sync operations
  - `id` (uuid, primary key)
  - `sync_type` (text) - manual, automatic
  - `products_synced` (integer) - Number of products synced
  - `products_added` (integer) - New products
  - `products_updated` (integer) - Updated products
  - `products_failed` (integer) - Failed products
  - `error_log` (text) - Error details if any
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for products and bundles
  - Admin-only write access for bundles and rules
  - Analytics write access for authenticated users
*/

-- Create woocommerce_products table
CREATE TABLE IF NOT EXISTS woocommerce_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wc_product_id bigint UNIQUE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  images jsonb DEFAULT '[]'::jsonb,
  category_ids bigint[] DEFAULT ARRAY[]::bigint[],
  brand text,
  price decimal(10,2) NOT NULL,
  sale_price decimal(10,2),
  stock_quantity integer DEFAULT 0,
  stock_status text DEFAULT 'in_stock',
  weight text,
  tags text[] DEFAULT ARRAY[]::text[],
  coin_reward integer DEFAULT 0,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wc_products_wc_id ON woocommerce_products(wc_product_id);
CREATE INDEX IF NOT EXISTS idx_wc_products_slug ON woocommerce_products(slug);
CREATE INDEX IF NOT EXISTS idx_wc_products_stock ON woocommerce_products(stock_status);
CREATE INDEX IF NOT EXISTS idx_wc_products_sync ON woocommerce_products(last_synced_at);

-- Create product_bundles table
CREATE TABLE IF NOT EXISTS product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  product_ids uuid[] DEFAULT ARRAY[]::uuid[],
  original_price decimal(10,2) NOT NULL,
  bundle_price decimal(10,2) NOT NULL,
  savings_amount decimal(10,2) GENERATED ALWAYS AS (original_price - bundle_price) STORED,
  coin_reward integer DEFAULT 0,
  is_active boolean DEFAULT true,
  display_locations text[] DEFAULT ARRAY['homepage']::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bundles_active ON product_bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_bundles_slug ON product_bundles(slug);

-- Create cross_sell_rules table
CREATE TABLE IF NOT EXISTS cross_sell_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES woocommerce_products(id) ON DELETE CASCADE,
  recommended_product_id uuid NOT NULL REFERENCES woocommerce_products(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'manual',
  priority integer DEFAULT 100,
  conversion_rate decimal(5,4) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cross_sell_product ON cross_sell_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_cross_sell_active ON cross_sell_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_cross_sell_priority ON cross_sell_rules(priority DESC);

-- Create growth_analytics table
CREATE TABLE IF NOT EXISTS growth_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  product_id uuid REFERENCES woocommerce_products(id) ON DELETE SET NULL,
  bundle_id uuid REFERENCES product_bundles(id) ON DELETE SET NULL,
  user_id uuid,
  session_id text,
  revenue_impact decimal(10,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON growth_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON growth_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_product ON growth_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_bundle ON growth_analytics(bundle_id);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  products_synced integer DEFAULT 0,
  products_added integer DEFAULT 0,
  products_updated integer DEFAULT 0,
  products_failed integer DEFAULT 0,
  error_log text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_date ON sync_logs(started_at DESC);

-- Enable Row Level Security
ALTER TABLE woocommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_sell_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for woocommerce_products
CREATE POLICY "Public can view in-stock products"
  ON woocommerce_products FOR SELECT
  USING (stock_status = 'in_stock');

CREATE POLICY "Authenticated users can view all products"
  ON woocommerce_products FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for product_bundles
CREATE POLICY "Public can view active bundles"
  ON product_bundles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all bundles"
  ON product_bundles FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for cross_sell_rules
CREATE POLICY "Public can view active cross-sell rules"
  ON cross_sell_rules FOR SELECT
  USING (is_active = true);

-- RLS Policies for growth_analytics
CREATE POLICY "Users can insert analytics events"
  ON growth_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view analytics"
  ON growth_analytics FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for sync_logs
CREATE POLICY "Authenticated users can view sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_wc_products_updated_at ON woocommerce_products;
CREATE TRIGGER update_wc_products_updated_at
  BEFORE UPDATE ON woocommerce_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bundles_updated_at ON product_bundles;
CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON product_bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
