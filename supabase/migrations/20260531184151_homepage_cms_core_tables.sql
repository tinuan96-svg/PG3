/*
  # Homepage CMS - Core Tables and Fields

  Adds all infrastructure needed for a fully DB-driven homepage.

  1. New Tables: homepage_banners, delivery_regions
  2. New columns: products (flash deal), categories (homepage), brands (homepage)
  3. Seeds default banners and delivery regions
  4. Ensures all required homepage_sections rows exist
*/

-- ─── homepage_banners ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS homepage_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  description text DEFAULT '',
  image_url text DEFAULT '',
  mobile_image_url text DEFAULT '',
  cta_text text DEFAULT 'Shop Now',
  cta_url text DEFAULT '/products',
  badge_text text DEFAULT '',
  badge_color text DEFAULT '#5FAE9B',
  background_color text DEFAULT 'from-[#0F2747] to-[#1a3a6b]',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read homepage banners"
  ON homepage_banners FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert homepage banners"
  ON homepage_banners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can update homepage banners"
  ON homepage_banners FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can delete homepage banners"
  ON homepage_banners FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ─── delivery_regions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS delivery_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  href text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read delivery regions"
  ON delivery_regions FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert delivery regions"
  ON delivery_regions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can update delivery regions"
  ON delivery_regions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can delete delivery regions"
  ON delivery_regions FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ─── products: flash deal fields ─────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_flash_deal') THEN
    ALTER TABLE products ADD COLUMN is_flash_deal boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'deal_price') THEN
    ALTER TABLE products ADD COLUMN deal_price numeric(10,2) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'deal_ends_at') THEN
    ALTER TABLE products ADD COLUMN deal_ends_at timestamptz DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'show_on_homepage') THEN
    ALTER TABLE products ADD COLUMN show_on_homepage boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ─── categories: homepage flags ──────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'show_on_homepage') THEN
    ALTER TABLE categories ADD COLUMN show_on_homepage boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'homepage_order') THEN
    ALTER TABLE categories ADD COLUMN homepage_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ─── brands: homepage flags ───────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brands') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'show_on_homepage') THEN
      ALTER TABLE brands ADD COLUMN show_on_homepage boolean NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'homepage_order') THEN
      ALTER TABLE brands ADD COLUMN homepage_order integer NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'description') THEN
      ALTER TABLE brands ADD COLUMN description text DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'color') THEN
      ALTER TABLE brands ADD COLUMN color text DEFAULT '#0F2747';
    END IF;
  END IF;
END $$;

-- ─── recipes: homepage flags ──────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recipes') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'show_on_homepage') THEN
      ALTER TABLE recipes ADD COLUMN show_on_homepage boolean NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'is_featured') THEN
      ALTER TABLE recipes ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

-- ─── Seed delivery regions if none exist ─────────────────────────────────────

INSERT INTO delivery_regions (name, description, href, display_order, is_active)
SELECT v.name, v.description, v.href, v.display_order, true
FROM (VALUES
  ('London',     'Same region next day delivery',  '/kerala-groceries-london',     0),
  ('Manchester', 'Fast delivery to Manchester',    '/kerala-groceries-manchester',  1),
  ('Birmingham', 'Next day to Birmingham',         '/kerala-groceries-birmingham',  2),
  ('Leeds',      'Delivery across Leeds',          '/kerala-groceries-leeds',       3),
  ('Glasgow',    'Serving all of Glasgow',         '/kerala-groceries-glasgow',     4),
  ('Leicester',  'Next day to Leicester',          '/kerala-groceries-leicester',   5)
) AS v(name, description, href, display_order)
WHERE NOT EXISTS (SELECT 1 FROM delivery_regions LIMIT 1);

-- ─── Seed default hero banners if none exist ─────────────────────────────────

INSERT INTO homepage_banners (title, subtitle, cta_text, cta_url, badge_text, badge_color, background_color, display_order, is_active)
SELECT v.title, v.subtitle, v.cta_text, v.cta_url, v.badge_text, v.badge_color, v.background_color, v.display_order, true
FROM (VALUES
  ('Authentic Kerala, Delivered Next Day', 'Free delivery on orders over £35',          'Shop Now',        '/products',             'Next Day Delivery', '#5FAE9B', 'from-[#0F2747] to-[#1a3a6b]', 0),
  ('New Arrivals This Week',               'Fresh Kerala products just landed',          'See What''s New', '/products?filter=new',  'Just Arrived',      '#e5a100', 'from-[#1a4a3a] to-[#0d3020]', 1),
  ('Up to 30% Off Best Sellers',           'Grab your favourites before they sell out', 'View Deals',      '/products?filter=deals', 'Limited Time',     '#e55c5c', 'from-[#5C2A0D] to-[#3d1a08]', 2)
) AS v(title, subtitle, cta_text, cta_url, badge_text, badge_color, background_color, display_order)
WHERE NOT EXISTS (SELECT 1 FROM homepage_banners LIMIT 1);

-- ─── Ensure all homepage sections exist (uses actual column names) ────────────

INSERT INTO homepage_sections (section_key, title, is_enabled, display_order)
VALUES
  ('trending',         'Trending Products',     true,  6),
  ('best_sellers',     'Best Sellers',          true,  7),
  ('cook_and_shop',    'Cook & Shop (Recipes)', true,  8),
  ('community_favs',   'Community Favourites',  true,  9),
  ('delivery_regions', 'Delivery Regions',      true, 10),
  ('newsletter',       'Newsletter',            true, 11)
ON CONFLICT (section_key) DO NOTHING;
