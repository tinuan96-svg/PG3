/*
  # Kerala Recipe & Smart Basket System

  ## New Tables
  - `recipe_categories` — category taxonomy
  - `recipe_analytics`  — tracks views, basket clicks, revenue

  ## Altered Tables
  - `recipes`            — add category_id, tags, nutrition_info
  - `recipe_ingredients` — add is_optional, search_terms

  ## RPCs
  - `get_recipes_with_availability`
  - `get_recipe_detail_with_availability`
  - `track_recipe_event`
  - `get_recipe_analytics_admin`

  ## Notes
  Products availability = approval_status='approved' AND visibility_status='visible'
  AND stock_qty > 0 (this table has no in_stock column; stock_qty drives it)
*/

-- ─── recipe_categories ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  emoji       text NOT NULL DEFAULT '🍽️',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recipe categories"
  ON recipe_categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert recipe categories"
  ON recipe_categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update recipe categories"
  ON recipe_categories FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete recipe categories"
  ON recipe_categories FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- ─── recipe_analytics ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_analytics (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id            uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  views                integer NOT NULL DEFAULT 0,
  basket_clicks        integer NOT NULL DEFAULT 0,
  add_to_pocket_count  integer NOT NULL DEFAULT 0,
  revenue_generated    numeric(10,2) NOT NULL DEFAULT 0,
  last_viewed_at       timestamptz,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE(recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_analytics_recipe_id ON recipe_analytics(recipe_id);
ALTER TABLE recipe_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read analytics"
  ON recipe_analytics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can insert analytics"
  ON recipe_analytics FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update analytics"
  ON recipe_analytics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ─── Extend recipes ───────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'category_id') THEN
    ALTER TABLE recipes ADD COLUMN category_id uuid REFERENCES recipe_categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'tags') THEN
    ALTER TABLE recipes ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'nutrition_info') THEN
    ALTER TABLE recipes ADD COLUMN nutrition_info jsonb DEFAULT '{}';
  END IF;
END $$;

-- ─── Extend recipe_ingredients ────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipe_ingredients' AND column_name = 'is_optional') THEN
    ALTER TABLE recipe_ingredients ADD COLUMN is_optional boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipe_ingredients' AND column_name = 'search_terms') THEN
    ALTER TABLE recipe_ingredients ADD COLUMN search_terms text[] DEFAULT '{}';
  END IF;
END $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);
CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipe_products_recipe_id ON recipe_products(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_products_product_id ON recipe_products(product_id);

-- ─── RPC helpers (availability = approved + visible + stock > 0) ──────────────

-- is_available: product is approved, visible, in stock
-- We use: p.approval_status='approved' AND p.visibility_status='visible' AND p.stock_qty > 0

CREATE OR REPLACE FUNCTION get_recipes_with_availability(
  p_limit         integer DEFAULT 20,
  p_offset        integer DEFAULT 0,
  p_category_slug text    DEFAULT NULL
)
RETURNS TABLE (
  id                 uuid,
  title              text,
  slug               text,
  excerpt            text,
  featured_image     text,
  prep_time_mins     integer,
  cook_time_mins     integer,
  servings           integer,
  difficulty         text,
  tags               text[],
  category_id        uuid,
  category_name      text,
  category_emoji     text,
  show_on_homepage   boolean,
  is_featured        boolean,
  total_products     integer,
  available_products integer,
  availability_pct   integer,
  matched_products   jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT
    r.id, r.title, r.slug, r.excerpt, r.featured_image,
    r.prep_time_mins, r.cook_time_mins, r.servings, r.difficulty,
    COALESCE(r.tags, '{}'),
    r.category_id,
    rc.name  AS category_name,
    rc.emoji AS category_emoji,
    r.show_on_homepage, r.is_featured,
    COUNT(rp.product_id)::integer AS total_products,
    COUNT(p.id) FILTER (
      WHERE p.id IS NOT NULL
        AND p.approval_status = 'approved'
        AND p.visibility_status = 'visible'
        AND COALESCE(p.stock_qty, 0) > 0
    )::integer AS available_products,
    CASE
      WHEN COUNT(rp.product_id) = 0 THEN 0
      ELSE (COUNT(p.id) FILTER (
              WHERE p.id IS NOT NULL
                AND p.approval_status = 'approved'
                AND p.visibility_status = 'visible'
                AND COALESCE(p.stock_qty, 0) > 0
            ) * 100 / COUNT(rp.product_id))::integer
    END AS availability_pct,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id',       p.id,
          'name',     p.name,
          'slug',     p.slug,
          'price',    p.price,
          'image',    p.image,
          'in_stock', (p.id IS NOT NULL AND p.approval_status = 'approved'
                       AND p.visibility_status = 'visible'
                       AND COALESCE(p.stock_qty, 0) > 0)
        )
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::jsonb
    ) AS matched_products
  FROM recipes r
  LEFT JOIN recipe_categories rc ON rc.id = r.category_id
  LEFT JOIN recipe_products rp ON rp.recipe_id = r.id
  LEFT JOIN products p ON p.id = rp.product_id
  WHERE r.status = 'published'
    AND (p_category_slug IS NULL OR rc.slug = p_category_slug)
  GROUP BY r.id, r.title, r.slug, r.excerpt, r.featured_image,
           r.prep_time_mins, r.cook_time_mins, r.servings, r.difficulty,
           r.tags, r.category_id, rc.name, rc.emoji,
           r.show_on_homepage, r.is_featured
  ORDER BY r.is_featured DESC, availability_pct DESC, r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION get_recipes_with_availability TO anon, authenticated;

-- ─── RPC: detail ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_recipe_detail_with_availability(p_slug text)
RETURNS TABLE (
  id                 uuid,
  title              text,
  slug               text,
  excerpt            text,
  instructions       text,
  featured_image     text,
  prep_time_mins     integer,
  cook_time_mins     integer,
  servings           integer,
  difficulty         text,
  tags               text[],
  seo_title          text,
  seo_description    text,
  seo_keywords       text,
  nutrition_info     jsonb,
  category_id        uuid,
  category_name      text,
  category_emoji     text,
  total_products     integer,
  available_products integer,
  availability_pct   integer,
  matched_products   jsonb,
  ingredients        jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT
    r.id, r.title, r.slug, r.excerpt, r.instructions, r.featured_image,
    r.prep_time_mins, r.cook_time_mins, r.servings, r.difficulty,
    COALESCE(r.tags, '{}'),
    r.seo_title, r.seo_description, r.seo_keywords,
    COALESCE(r.nutrition_info, '{}'::jsonb),
    r.category_id,
    rc.name  AS category_name,
    rc.emoji AS category_emoji,
    COUNT(rp.product_id)::integer AS total_products,
    COUNT(p.id) FILTER (
      WHERE p.id IS NOT NULL AND p.approval_status = 'approved'
        AND p.visibility_status = 'visible' AND COALESCE(p.stock_qty, 0) > 0
    )::integer AS available_products,
    CASE
      WHEN COUNT(rp.product_id) = 0 THEN 0
      ELSE (COUNT(p.id) FILTER (
              WHERE p.id IS NOT NULL AND p.approval_status = 'approved'
                AND p.visibility_status = 'visible' AND COALESCE(p.stock_qty, 0) > 0
            ) * 100 / COUNT(rp.product_id))::integer
    END AS availability_pct,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id',       p.id,
          'name',     p.name,
          'slug',     p.slug,
          'price',    p.price,
          'image',    p.image,
          'in_stock', (p.id IS NOT NULL AND p.approval_status = 'approved'
                       AND p.visibility_status = 'visible' AND COALESCE(p.stock_qty, 0) > 0)
        )
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::jsonb
    ) AS matched_products,
    (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', ri.id, 'name', ri.name, 'quantity', ri.quantity,
            'unit', ri.unit, 'is_optional', ri.is_optional, 'sort_order', ri.sort_order
          ) ORDER BY ri.sort_order
        ), '[]'::jsonb
      )
      FROM recipe_ingredients ri WHERE ri.recipe_id = r.id
    ) AS ingredients
  FROM recipes r
  LEFT JOIN recipe_categories rc ON rc.id = r.category_id
  LEFT JOIN recipe_products rp ON rp.recipe_id = r.id
  LEFT JOIN products p ON p.id = rp.product_id
  WHERE r.slug = p_slug AND r.status = 'published'
  GROUP BY r.id, r.title, r.slug, r.excerpt, r.instructions, r.featured_image,
           r.prep_time_mins, r.cook_time_mins, r.servings, r.difficulty,
           r.tags, r.seo_title, r.seo_description, r.seo_keywords,
           r.nutrition_info, r.category_id, rc.name, rc.emoji
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_recipe_detail_with_availability TO anon, authenticated;

-- ─── RPC: track_recipe_event ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION track_recipe_event(p_recipe_id uuid, p_event text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO recipe_analytics (recipe_id, views, basket_clicks, add_to_pocket_count, last_viewed_at)
  VALUES (
    p_recipe_id,
    CASE WHEN p_event = 'view'          THEN 1 ELSE 0 END,
    CASE WHEN p_event = 'basket_click'  THEN 1 ELSE 0 END,
    CASE WHEN p_event = 'add_to_pocket' THEN 1 ELSE 0 END,
    CASE WHEN p_event = 'view'          THEN now() ELSE NULL END
  )
  ON CONFLICT (recipe_id) DO UPDATE SET
    views               = recipe_analytics.views + CASE WHEN p_event = 'view' THEN 1 ELSE 0 END,
    basket_clicks       = recipe_analytics.basket_clicks + CASE WHEN p_event = 'basket_click' THEN 1 ELSE 0 END,
    add_to_pocket_count = recipe_analytics.add_to_pocket_count + CASE WHEN p_event = 'add_to_pocket' THEN 1 ELSE 0 END,
    last_viewed_at      = CASE WHEN p_event = 'view' THEN now() ELSE recipe_analytics.last_viewed_at END,
    updated_at          = now();
END;
$$;

GRANT EXECUTE ON FUNCTION track_recipe_event TO anon, authenticated;

-- ─── RPC: admin analytics ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_recipe_analytics_admin()
RETURNS TABLE (
  recipe_id           uuid,
  title               text,
  slug                text,
  status              text,
  availability_pct    integer,
  total_products      integer,
  available_products  integer,
  views               integer,
  basket_clicks       integer,
  add_to_pocket_count integer,
  revenue_generated   numeric,
  last_viewed_at      timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT
    r.id, r.title, r.slug, r.status,
    CASE WHEN COUNT(rp.product_id) = 0 THEN 0
         ELSE (COUNT(p.id) FILTER (
                 WHERE p.id IS NOT NULL AND p.approval_status = 'approved'
                   AND p.visibility_status = 'visible' AND COALESCE(p.stock_qty, 0) > 0
               ) * 100 / COUNT(rp.product_id))::integer
    END AS availability_pct,
    COUNT(rp.product_id)::integer AS total_products,
    COUNT(p.id) FILTER (
      WHERE p.id IS NOT NULL AND p.approval_status = 'approved'
        AND p.visibility_status = 'visible' AND COALESCE(p.stock_qty, 0) > 0
    )::integer AS available_products,
    COALESCE(ra.views, 0)               AS views,
    COALESCE(ra.basket_clicks, 0)       AS basket_clicks,
    COALESCE(ra.add_to_pocket_count, 0) AS add_to_pocket_count,
    COALESCE(ra.revenue_generated, 0)   AS revenue_generated,
    ra.last_viewed_at
  FROM recipes r
  LEFT JOIN recipe_products rp ON rp.recipe_id = r.id
  LEFT JOIN products p ON p.id = rp.product_id
  LEFT JOIN recipe_analytics ra ON ra.recipe_id = r.id
  GROUP BY r.id, r.title, r.slug, r.status,
           ra.views, ra.basket_clicks, ra.add_to_pocket_count,
           ra.revenue_generated, ra.last_viewed_at
  ORDER BY COALESCE(ra.views, 0) DESC;
$$;

GRANT EXECUTE ON FUNCTION get_recipe_analytics_admin TO authenticated;

-- ─── Seed categories ──────────────────────────────────────────────────────────

INSERT INTO recipe_categories (name, slug, emoji, sort_order) VALUES
  ('Breakfast',      'breakfast',      '🌅', 1),
  ('Lunch',          'lunch',          '🍱', 2),
  ('Dinner',         'dinner',         '🍛', 3),
  ('Snacks',         'snacks',         '🍪', 4),
  ('Vegetarian',     'vegetarian',     '🥦', 5),
  ('Non-Vegetarian', 'non-vegetarian', '🍗', 6),
  ('Seafood',        'seafood',        '🐟', 7),
  ('Festival',       'festival',       '🎉', 8),
  ('Kids',           'kids',           '👶', 9),
  ('Quick Meals',    'quick-meals',    '⚡', 10),
  ('Desserts',       'desserts',       '🍮', 11),
  ('Drinks',         'drinks',         '☕', 12)
ON CONFLICT (slug) DO NOTHING;
