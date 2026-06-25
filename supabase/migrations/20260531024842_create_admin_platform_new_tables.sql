/*
  # PocketGrocery Admin Platform — New Tables

  Creates missing tables adapting to existing schema conventions
  (is_active, image columns match existing tables).

  New tables:
    - announcements
    - delivery_settings
    - pricing_rules
    - price_history
    - homepage_sections

  Enhances existing tables:
    - banners: add subtitle, mobile_image, cta fields
    - categories: add featured, seo, color fields
*/

-- ─── Enhance banners ──────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='mobile_image') THEN
    ALTER TABLE banners ADD COLUMN mobile_image text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='updated_at') THEN
    ALTER TABLE banners ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ─── Enhance categories ───────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='featured') THEN
    ALTER TABLE categories ADD COLUMN featured boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='seo_title') THEN
    ALTER TABLE categories ADD COLUMN seo_title text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='seo_description') THEN
    ALTER TABLE categories ADD COLUMN seo_description text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='seo_keywords') THEN
    ALTER TABLE categories ADD COLUMN seo_keywords text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='color') THEN
    ALTER TABLE categories ADD COLUMN color text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='updated_at') THEN
    ALTER TABLE categories ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ─── Announcements ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message       text NOT NULL DEFAULT '',
  bg_color      text NOT NULL DEFAULT '#0F2747',
  text_color    text NOT NULL DEFAULT '#ffffff',
  link_url      text DEFAULT '',
  link_text     text DEFAULT '',
  starts_at     timestamptz DEFAULT NULL,
  ends_at       timestamptz DEFAULT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Admins select announcements') THEN
    CREATE POLICY "Admins select announcements" ON announcements FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Anon select active announcements') THEN
    CREATE POLICY "Anon select active announcements" ON announcements FOR SELECT TO anon
      USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Admins insert announcements') THEN
    CREATE POLICY "Admins insert announcements" ON announcements FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Admins update announcements') THEN
    CREATE POLICY "Admins update announcements" ON announcements FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Admins delete announcements') THEN
    CREATE POLICY "Admins delete announcements" ON announcements FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ─── Delivery settings ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS delivery_settings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_key         text NOT NULL UNIQUE,
  label              text NOT NULL DEFAULT '',
  description        text NOT NULL DEFAULT '',
  is_enabled         boolean NOT NULL DEFAULT true,
  fee                numeric(10,2) NOT NULL DEFAULT 0,
  free_threshold     numeric(10,2) DEFAULT NULL,
  min_order          numeric(10,2) NOT NULL DEFAULT 0,
  est_days_min       integer DEFAULT NULL,
  est_days_max       integer DEFAULT NULL,
  display_order      integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_settings' AND policyname='Admins select delivery') THEN
    CREATE POLICY "Admins select delivery" ON delivery_settings FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_settings' AND policyname='Anon select delivery') THEN
    CREATE POLICY "Anon select delivery" ON delivery_settings FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_settings' AND policyname='Admins insert delivery') THEN
    CREATE POLICY "Admins insert delivery" ON delivery_settings FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_settings' AND policyname='Admins update delivery') THEN
    CREATE POLICY "Admins update delivery" ON delivery_settings FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_settings' AND policyname='Admins delete delivery') THEN
    CREATE POLICY "Admins delete delivery" ON delivery_settings FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

INSERT INTO delivery_settings (method_key, label, description, is_enabled, fee, free_threshold, min_order, est_days_min, est_days_max, display_order)
VALUES
  ('standard',      'Standard Delivery',  'Delivered in 3-5 working days',  true,  4.99, 40.00, 0,   3, 5, 1),
  ('express',       'Express Delivery',   'Delivered in 1-2 working days',  true,  7.99, NULL,  0,   1, 2, 2),
  ('same_day',      'Same Day Delivery',  'Order before 12pm for same day', false, 12.99, NULL, 20,  0, 0, 3),
  ('click_collect', 'Click & Collect',    'Collect from our store',         false, 0,    NULL,  0,   0, 0, 4)
ON CONFLICT (method_key) DO NOTHING;

-- ─── Pricing rules ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pricing_rules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type  text NOT NULL CHECK (rule_type IN ('global', 'category', 'brand', 'product')),
  target_id  uuid DEFAULT NULL,
  markup_pct numeric(6,2) NOT NULL DEFAULT 0,
  label      text DEFAULT '',
  is_active  boolean NOT NULL DEFAULT true,
  priority   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pricing_rules' AND policyname='Admins select pricing rules') THEN
    CREATE POLICY "Admins select pricing rules" ON pricing_rules FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pricing_rules' AND policyname='Admins insert pricing rules') THEN
    CREATE POLICY "Admins insert pricing rules" ON pricing_rules FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pricing_rules' AND policyname='Admins update pricing rules') THEN
    CREATE POLICY "Admins update pricing rules" ON pricing_rules FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pricing_rules' AND policyname='Admins delete pricing rules') THEN
    CREATE POLICY "Admins delete pricing rules" ON pricing_rules FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

INSERT INTO pricing_rules (rule_type, markup_pct, label, is_active, priority)
VALUES ('global', 30, 'Default global markup (30%)', true, 0)
ON CONFLICT DO NOTHING;

-- ─── Price history ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS price_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price  numeric(10,2) NOT NULL,
  new_price  numeric(10,2) NOT NULL,
  changed_by text DEFAULT 'system',
  rule_id    uuid REFERENCES pricing_rules(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='price_history' AND policyname='Admins select price history') THEN
    CREATE POLICY "Admins select price history" ON price_history FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='price_history' AND policyname='Admins insert price history') THEN
    CREATE POLICY "Admins insert price history" ON price_history FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history (product_id, created_at DESC);

-- ─── Homepage sections ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS homepage_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key   text NOT NULL UNIQUE,
  title         text NOT NULL DEFAULT '',
  subtitle      text DEFAULT '',
  is_enabled    boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  config        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='homepage_sections' AND policyname='Admins select homepage') THEN
    CREATE POLICY "Admins select homepage" ON homepage_sections FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='homepage_sections' AND policyname='Anon select enabled homepage') THEN
    CREATE POLICY "Anon select enabled homepage" ON homepage_sections FOR SELECT TO anon USING (is_enabled = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='homepage_sections' AND policyname='Admins insert homepage') THEN
    CREATE POLICY "Admins insert homepage" ON homepage_sections FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='homepage_sections' AND policyname='Admins update homepage') THEN
    CREATE POLICY "Admins update homepage" ON homepage_sections FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='homepage_sections' AND policyname='Admins delete homepage') THEN
    CREATE POLICY "Admins delete homepage" ON homepage_sections FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

INSERT INTO homepage_sections (section_key, title, subtitle, is_enabled, display_order, config)
VALUES
  ('hero',              'Hero Banner',         'Main hero slider',             true,  0, '{"type":"banner"}'::jsonb),
  ('featured_products', 'Featured Products',   'Highlighted product carousel', true,  1, '{"count":8}'::jsonb),
  ('categories',        'Shop by Category',    'Category grid',                true,  2, '{"count":8}'::jsonb),
  ('flash_deals',       'Flash Deals',         'Limited time offers',          false, 3, '{"count":6}'::jsonb),
  ('new_arrivals',      'New Arrivals',         'Recently added products',      true,  4, '{"count":8}'::jsonb),
  ('brands',            'Popular Brands',      'Brand showcase',               false, 5, '{"count":8}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_banners_order   ON banners (display_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ann_active      ON announcements (is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_delivery_order  ON delivery_settings (display_order);
CREATE INDEX IF NOT EXISTS idx_pricing_type    ON pricing_rules (rule_type, priority DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories (sort_order, name);
