/*
  # Shop By Food Type System

  ## New Tables
  - `food_types`         — collection definitions (Vegetarian, Breakfast, etc.)
  - `food_type_products` — explicit product → food_type assignments (AI or manual)

  ## New RPCs
  - `get_food_types_with_counts` — food types + live product counts
  - `get_food_type_products`     — paginated approved products for a food type
  - `assign_food_type_product`   — admin: add/update a product assignment
  - `remove_food_type_product`   — admin: remove a product assignment
  - `ai_classify_product_food_types` — auto-classify one product by keyword matching

  ## Auto-classification trigger
  - After a product is approved (approval_status = 'approved'), auto-classify it
    into matching food types via keyword matching on name, tags, category

  ## Security
  - Public can read food_types and food_type_products
  - Only admin can write
*/

-- ─── food_types ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS food_types (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL UNIQUE,
  slug             text NOT NULL UNIQUE,
  emoji            text NOT NULL DEFAULT '🍽️',
  description      text NOT NULL DEFAULT '',
  banner_image     text,
  bg_color         text NOT NULL DEFAULT '#0F2747',
  accent_color     text NOT NULL DEFAULT '#5FAE9B',
  sort_order       integer NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  show_on_homepage boolean NOT NULL DEFAULT true,
  -- AI classification keywords (product names / tags / categories must match any of these)
  keywords         text[] NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE food_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active food types"
  ON food_types FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert food types"
  ON food_types FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update food types"
  ON food_types FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete food types"
  ON food_types FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- ─── food_type_products ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS food_type_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_type_id  uuid NOT NULL REFERENCES food_types(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source        text NOT NULL DEFAULT 'ai',  -- 'ai' | 'manual'
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (food_type_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_ftp_food_type_id ON food_type_products(food_type_id);
CREATE INDEX IF NOT EXISTS idx_ftp_product_id   ON food_type_products(product_id);

ALTER TABLE food_type_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read food type products"
  ON food_type_products FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert food type products"
  ON food_type_products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update food type products"
  ON food_type_products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete food type products"
  ON food_type_products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_food_types_slug ON food_types(slug);
CREATE INDEX IF NOT EXISTS idx_food_types_homepage ON food_types(show_on_homepage) WHERE show_on_homepage = true;

-- ─── RPC: get_food_types_with_counts ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_food_types_with_counts()
RETURNS TABLE (
  id               uuid,
  name             text,
  slug             text,
  emoji            text,
  description      text,
  banner_image     text,
  bg_color         text,
  accent_color     text,
  sort_order       integer,
  is_active        boolean,
  show_on_homepage boolean,
  keywords         text[],
  product_count    integer,
  sample_images    jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT
    ft.id, ft.name, ft.slug, ft.emoji, ft.description,
    ft.banner_image, ft.bg_color, ft.accent_color,
    ft.sort_order, ft.is_active, ft.show_on_homepage, ft.keywords,
    COUNT(ftp.product_id)::integer AS product_count,
    (
      SELECT COALESCE(
        jsonb_agg(p2.image ORDER BY p2.created_at DESC) FILTER (WHERE p2.image IS NOT NULL),
        '[]'::jsonb
      )
      FROM (
        SELECT p3.image, p3.created_at
        FROM food_type_products ftp2
        JOIN products p3 ON p3.id = ftp2.product_id
          AND p3.approval_status = 'approved'
          AND p3.visibility_status = 'visible'
          AND COALESCE(p3.stock_qty, 0) > 0
        WHERE ftp2.food_type_id = ft.id
        LIMIT 4
      ) p2
    ) AS sample_images
  FROM food_types ft
  LEFT JOIN food_type_products ftp ON ftp.food_type_id = ft.id
  LEFT JOIN products p ON p.id = ftp.product_id
    AND p.approval_status = 'approved'
    AND p.visibility_status = 'visible'
    AND COALESCE(p.stock_qty, 0) > 0
  GROUP BY ft.id, ft.name, ft.slug, ft.emoji, ft.description,
           ft.banner_image, ft.bg_color, ft.accent_color,
           ft.sort_order, ft.is_active, ft.show_on_homepage, ft.keywords
  ORDER BY ft.sort_order ASC;
$$;

GRANT EXECUTE ON FUNCTION get_food_types_with_counts TO anon, authenticated;

-- ─── RPC: get_food_type_products ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_food_type_products(
  p_slug   text,
  p_limit  integer DEFAULT 24,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  product_id   uuid,
  name         text,
  slug         text,
  image        text,
  price        numeric,
  compare_price numeric,
  source       text,
  is_featured  boolean,
  is_flash_deal boolean
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT
    p.id        AS product_id,
    p.name,
    p.slug,
    p.image,
    p.price,
    p.compare_price,
    ftp.source,
    COALESCE(p.featured, false) AS is_featured,
    COALESCE(p.is_flash_deal, false) AS is_flash_deal
  FROM food_types ft
  JOIN food_type_products ftp ON ftp.food_type_id = ft.id
  JOIN products p ON p.id = ftp.product_id
    AND p.approval_status = 'approved'
    AND p.visibility_status = 'visible'
    AND COALESCE(p.stock_qty, 0) > 0
  WHERE ft.slug = p_slug AND ft.is_active = true
  ORDER BY ftp.sort_order ASC, p.name ASC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION get_food_type_products TO anon, authenticated;

-- ─── RPC: ai_classify_product_food_types ─────────────────────────────────────

CREATE OR REPLACE FUNCTION ai_classify_product_food_types(p_product_id uuid)
RETURNS integer   -- returns number of food types assigned
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product  RECORD;
  v_ft       RECORD;
  v_haystack text;
  v_matched  integer := 0;
  v_kw       text;
BEGIN
  -- Load product
  SELECT name, COALESCE(tags::text, '') AS tags_text,
         COALESCE(description, '') AS description,
         COALESCE(short_description, '') AS short_desc
  INTO v_product
  FROM products
  WHERE id = p_product_id
    AND approval_status = 'approved'
    AND visibility_status = 'visible';

  IF NOT FOUND THEN RETURN 0; END IF;

  -- Build searchable string (lowercase)
  v_haystack := lower(v_product.name || ' ' || v_product.tags_text || ' ' || v_product.short_desc);

  -- Match against each food type's keywords
  FOR v_ft IN SELECT id, keywords FROM food_types WHERE is_active = true AND array_length(keywords, 1) > 0 LOOP
    FOREACH v_kw IN ARRAY v_ft.keywords LOOP
      IF v_haystack ILIKE '%' || v_kw || '%' THEN
        INSERT INTO food_type_products (food_type_id, product_id, source)
        VALUES (v_ft.id, p_product_id, 'ai')
        ON CONFLICT (food_type_id, product_id) DO NOTHING;
        v_matched := v_matched + 1;
        EXIT; -- only count each food type once per product
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_matched;
END;
$$;

GRANT EXECUTE ON FUNCTION ai_classify_product_food_types TO authenticated;

-- ─── RPC: classify_all_approved_products ─────────────────────────────────────

CREATE OR REPLACE FUNCTION classify_all_approved_products()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product_id uuid;
  v_total      integer := 0;
BEGIN
  FOR v_product_id IN
    SELECT id FROM products
    WHERE approval_status = 'approved' AND visibility_status = 'visible'
  LOOP
    PERFORM ai_classify_product_food_types(v_product_id);
    v_total := v_total + 1;
  END LOOP;
  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION classify_all_approved_products TO authenticated;

-- ─── Seed: 6 default food types ───────────────────────────────────────────────

INSERT INTO food_types (name, slug, emoji, description, bg_color, accent_color, sort_order, keywords) VALUES
  (
    'Vegetarian',
    'vegetarian',
    '🥬',
    'Pure veg Kerala essentials — dals, vegetables, dairy and more',
    '#1a4a2e',
    '#4ade80',
    1,
    ARRAY['dal', 'lentil', 'vegetable', 'veg', 'paneer', 'tofu', 'spinach', 'broccoli', 'coconut', 'rice', 'flour', 'atta', 'moong', 'chana', 'rajma', 'toor', 'urad', 'chickpea']
  ),
  (
    'Non-Vegetarian',
    'non-vegetarian',
    '🍗',
    'Chicken, mutton and egg masalas, marinades and curries',
    '#4a1a1a',
    '#f87171',
    2,
    ARRAY['chicken', 'mutton', 'beef', 'pork', 'meat', 'egg', 'poultry', 'chicken masala', 'meat masala', 'non veg', 'nonveg']
  ),
  (
    'Breakfast',
    'breakfast',
    '🍳',
    'Puttu podi, appam mix, upma, idli and all your morning staples',
    '#3d2a00',
    '#fbbf24',
    3,
    ARRAY['puttu', 'appam', 'idli', 'dosa', 'upma', 'rava', 'semolina', 'poha', 'oats', 'cornflakes', 'porridge', 'breakfast', 'idiyappam', 'hoppers', 'pidi', 'pathiri']
  ),
  (
    'Lunch & Dinner',
    'lunch-dinner',
    '🍛',
    'Rice, curries, sambar, rasam — everything for a proper Kerala meal',
    '#0F2747',
    '#5FAE9B',
    4,
    ARRAY['sambar', 'rasam', 'curry', 'masala', 'biryani', 'rice', 'pickle', 'papad', 'papadum', 'chutney', 'tamarind', 'kootu', 'thoran', 'olan', 'pulissery', 'aviyal']
  ),
  (
    'Instant Cook',
    'instant-cook',
    '⚡',
    'Ready-to-cook mixes and instant meals — on the table in minutes',
    '#1a1a3e',
    '#818cf8',
    5,
    ARRAY['instant', 'ready', 'quick', 'mix', 'ready to cook', 'ready-to-cook', '2 min', '5 min', 'microwave', 'noodles', 'pasta', 'soup', 'packet', 'sachet']
  ),
  (
    'Party & Festival',
    'party-festival',
    '🎉',
    'Sweets, payasam, snacks and specials for Onam, Vishu and celebrations',
    '#3d0a30',
    '#e879f9',
    6,
    ARRAY['payasam', 'halwa', 'ladoo', 'barfi', 'sweet', 'festive', 'onam', 'vishu', 'sadya', 'kesari', 'kheer', 'halwa', 'modak', 'chakka', 'unniyappam', 'ada', 'snack', 'murukku', 'mixture', 'chips', 'namkeen']
  )
ON CONFLICT (slug) DO NOTHING;
