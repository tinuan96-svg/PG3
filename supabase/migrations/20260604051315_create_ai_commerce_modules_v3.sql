/*
  # AI Commerce Modules — Occasions, Festival Campaigns, Smart Search, Reorder Predictions

  ## New Tables
  - `occasions` — themed shopping collections (Onam, Christmas, etc.)
  - `occasion_products` — products assigned to an occasion
  - `festival_campaigns` — date-driven banner auto-activation calendar
  - `smart_search_logs` — logs every search query for analytics
  - `reorder_predictions` — per-user predicted reorder dates
  - `product_ai_content` — cached AI-generated content (FAQs, meta, highlights)

  ## Schema facts
  - products: image, thumbnail_url, brand (text), price, compare_price, featured, is_flash_deal
  - orders: total, order_status, created_at
  - No product_variants table — use p.price directly
*/

-- ─── Occasions ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS occasions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  slug             text NOT NULL UNIQUE,
  emoji            text NOT NULL DEFAULT '',
  description      text NOT NULL DEFAULT '',
  banner_image     text,
  bg_color         text NOT NULL DEFAULT '#0F2747',
  accent_color     text NOT NULL DEFAULT '#5FAE9B',
  is_active        boolean NOT NULL DEFAULT false,
  show_on_homepage boolean NOT NULL DEFAULT false,
  sort_order       int NOT NULL DEFAULT 0,
  product_count    int NOT NULL DEFAULT 0,
  sample_images    text[] NOT NULL DEFAULT '{}',
  keywords         text[] NOT NULL DEFAULT '{}',
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occasion_products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_id  uuid NOT NULL REFERENCES occasions(id) ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source       text NOT NULL DEFAULT 'manual' CHECK (source IN ('ai','manual')),
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (occasion_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_occasion_products_occasion_id ON occasion_products(occasion_id);
CREATE INDEX IF NOT EXISTS idx_occasion_products_product_id  ON occasion_products(product_id);

ALTER TABLE occasions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE occasion_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active occasions"
  ON occasions FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admin can read all occasions"
  ON occasions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can insert occasions"
  ON occasions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can update occasions"
  ON occasions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can delete occasions"
  ON occasions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can read occasion products"
  ON occasion_products FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM occasions o WHERE o.id = occasion_id AND o.is_active = true));
CREATE POLICY "Admin can insert occasion products"
  ON occasion_products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can update occasion products"
  ON occasion_products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can delete occasion products"
  ON occasion_products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- ─── Festival Campaigns ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS festival_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  emoji         text NOT NULL DEFAULT '',
  description   text NOT NULL DEFAULT '',
  banner_image  text,
  banner_link   text,
  bg_color      text NOT NULL DEFAULT '#0F2747',
  accent_color  text NOT NULL DEFAULT '#5FAE9B',
  is_active     boolean NOT NULL DEFAULT false,
  auto_activate boolean NOT NULL DEFAULT true,
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  occasion_id   uuid REFERENCES occasions(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_festival_campaigns_dates  ON festival_campaigns(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_festival_campaigns_active ON festival_campaigns(is_active);

ALTER TABLE festival_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read live festival campaigns"
  ON festival_campaigns FOR SELECT TO anon, authenticated
  USING (is_active = true OR (auto_activate = true AND starts_at <= now() AND ends_at >= now()));
CREATE POLICY "Admin can read all festival campaigns"
  ON festival_campaigns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can insert festival campaigns"
  ON festival_campaigns FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can update festival campaigns"
  ON festival_campaigns FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can delete festival campaigns"
  ON festival_campaigns FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- ─── Smart Search Logs ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS smart_search_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query        text NOT NULL,
  intent       text,
  result_count int NOT NULL DEFAULT 0,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   text,
  clicked_ids  uuid[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_query   ON smart_search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON smart_search_logs(created_at);

ALTER TABLE smart_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search logs"
  ON smart_search_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can read own search logs"
  ON smart_search_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can read all search logs"
  ON smart_search_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- ─── Reorder Predictions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reorder_predictions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id           uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  last_ordered_at      timestamptz NOT NULL,
  avg_reorder_days     int NOT NULL DEFAULT 30,
  predicted_reorder_at timestamptz NOT NULL,
  reminder_sent_at     timestamptz,
  times_ordered        int NOT NULL DEFAULT 1,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reorder_user      ON reorder_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_reorder_predicted ON reorder_predictions(predicted_reorder_at);

ALTER TABLE reorder_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own predictions"
  ON reorder_predictions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own predictions"
  ON reorder_predictions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own predictions"
  ON reorder_predictions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can read all predictions"
  ON reorder_predictions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- ─── Product AI Content Cache ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_ai_content (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  short_desc     text,
  full_desc      text,
  meta_title     text,
  meta_desc      text,
  seo_keywords   text[] NOT NULL DEFAULT '{}',
  highlights     text[] NOT NULL DEFAULT '{}',
  faqs           jsonb  NOT NULL DEFAULT '[]',
  usage_tips     text[] NOT NULL DEFAULT '{}',
  internal_links jsonb  NOT NULL DEFAULT '[]',
  ai_model       text   NOT NULL DEFAULT 'local',
  generated_at   timestamptz NOT NULL DEFAULT now(),
  needs_regen    boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_content_product    ON product_ai_content(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_needs_regen ON product_ai_content(needs_regen) WHERE needs_regen = true;

ALTER TABLE product_ai_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product ai content"
  ON product_ai_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can insert product ai content"
  ON product_ai_content FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can update product ai content"
  ON product_ai_content FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can delete product ai content"
  ON product_ai_content FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- ─── Seed Occasions ───────────────────────────────────────────────────────────

INSERT INTO occasions (name, slug, emoji, description, bg_color, accent_color, sort_order, is_active, show_on_homepage, keywords) VALUES
  ('Onam Sadya',        'onam-sadya',        '🌼', 'Everything for the perfect Onam feast — rice, curries, pickles, papadams and more.',        '#1B4332', '#52B788', 1, true, true,  ARRAY['onam','sadya','vishu','payasam','palada','sadhya']),
  ('Birthday Party',    'birthday-party',    '🎂', 'Snacks, sweets and party essentials to celebrate in style.',                                  '#7C2D12', '#FB923C', 2, true, true,  ARRAY['birthday','party','celebration','sweets','snacks','kids']),
  ('Christmas',         'christmas',         '🎄', 'Festive treats, plum cake ingredients and holiday favourites.',                               '#14532D', '#86EFAC', 3, true, false, ARRAY['christmas','xmas','december','holiday','cake','plum cake']),
  ('Eid Special',       'eid-special',       '🌙', 'Biriyani essentials, sweets and celebration packs for Eid Mubarak.',                          '#1E1B4B', '#818CF8', 4, true, false, ARRAY['eid','ramadan','biriyani','halal','dates']),
  ('Diwali Sweets',     'diwali-sweets',     '🪔', 'Traditional sweets, dry fruits, gift packs and Diwali essentials.',                           '#713F12', '#FCD34D', 5, true, false, ARRAY['diwali','deepavali','sweets','gifts','dry fruits','halwa']),
  ('Family Kerala Meal','family-kerala-meal','🍛', 'A full Kerala Sunday meal — rice, fish curry, sambar, thoran and more.',                      '#0F172A', '#5FAE9B', 6, true, true,  ARRAY['family','meal','sunday','rice','curry','sambar','thoran']),
  ('Rainy Day Snacks',  'rainy-day-snacks',  '☔', 'Chai-time favourites for cosy rainy days — chips, murukku, biscuits and hot drinks.',         '#1E3A5F', '#93C5FD', 7, true, true,  ARRAY['snacks','rainy','tea time','chips','murukku','biscuits','chai']),
  ('House Party',       'house-party',       '🎉', 'Party snacks, drinks and finger food essentials for a great night in.',                       '#4A044E', '#E879F9', 8, true, false, ARRAY['party','house party','drinks','gatherings','finger food'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO festival_campaigns (name, slug, emoji, description, bg_color, accent_color, auto_activate, starts_at, ends_at) VALUES
  ('Onam 2026',     'onam-2026',     '🌼', 'Celebrate Kerala''s harvest festival.',          '#1B4332', '#52B788', true, '2026-08-28 00:00:00+00', '2026-09-10 23:59:59+00'),
  ('Christmas 2026','christmas-2026','🎄', 'Kerala Christmas specials.',                      '#14532D', '#86EFAC', true, '2026-12-10 00:00:00+00', '2026-12-31 23:59:59+00'),
  ('Diwali 2026',   'diwali-2026',   '🪔', 'Kerala sweets and celebration packs.',            '#713F12', '#FCD34D', true, '2026-10-15 00:00:00+00', '2026-11-05 23:59:59+00'),
  ('New Year 2027', 'new-year-2027', '🎆', 'Ring in the New Year with Kerala favourites.',   '#0F172A', '#5FAE9B', true, '2026-12-28 00:00:00+00', '2027-01-05 23:59:59+00'),
  ('Vishu 2027',    'vishu-2027',    '🌸', 'Vishu Kani essentials and Kerala treats.',        '#1B4332', '#86EFAC', true, '2027-04-10 00:00:00+00', '2027-04-20 23:59:59+00')
ON CONFLICT (slug) DO NOTHING;

-- ─── RPCs ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_occasions_with_counts(p_homepage_only boolean DEFAULT false)
RETURNS TABLE (
  id uuid, name text, slug text, emoji text, description text,
  banner_image text, bg_color text, accent_color text, sort_order int,
  is_active boolean, show_on_homepage boolean, keywords text[],
  product_count bigint, sample_images text[]
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.name, o.slug, o.emoji, o.description,
    o.banner_image, o.bg_color, o.accent_color, o.sort_order,
    o.is_active, o.show_on_homepage, o.keywords,
    COUNT(DISTINCT op.product_id)::bigint,
    COALESCE(ARRAY(
      SELECT COALESCE(p.image, p.thumbnail_url)
      FROM occasion_products op2
      JOIN products p ON p.id = op2.product_id
      WHERE op2.occasion_id = o.id AND COALESCE(p.image, p.thumbnail_url) IS NOT NULL
      ORDER BY op2.sort_order LIMIT 4
    ), '{}'::text[])
  FROM occasions o
  LEFT JOIN occasion_products op ON op.occasion_id = o.id
  WHERE o.is_active = true AND (NOT p_homepage_only OR o.show_on_homepage = true)
  GROUP BY o.id ORDER BY o.sort_order, o.name
$$;
GRANT EXECUTE ON FUNCTION get_occasions_with_counts(boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_occasion_products(p_slug text, p_limit int DEFAULT 24, p_offset int DEFAULT 0)
RETURNS TABLE (
  product_id uuid, name text, slug text, image text,
  price numeric, compare_price numeric, source text,
  is_featured boolean, is_flash_deal boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.slug,
    COALESCE(p.image, p.thumbnail_url),
    p.price, p.compare_price, op.source,
    COALESCE(p.featured, false),
    COALESCE(p.is_flash_deal, false)
  FROM occasion_products op
  JOIN occasions o ON o.id = op.occasion_id
  JOIN products p ON p.id = op.product_id
  WHERE o.slug = p_slug AND o.is_active = true
    AND p.approval_status = 'approved' AND p.visibility_status = 'visible'
  ORDER BY op.sort_order, p.name
  LIMIT p_limit OFFSET p_offset
$$;
GRANT EXECUTE ON FUNCTION get_occasion_products(text, int, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION smart_search_products(p_query text, p_limit int DEFAULT 20, p_offset int DEFAULT 0)
RETURNS TABLE (
  product_id uuid, name text, slug text, image text,
  price numeric, compare_price numeric, brand_name text, relevance real
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_query text := lower(trim(p_query));
  v_ts    tsquery;
BEGIN
  BEGIN v_ts := websearch_to_tsquery('english', v_query);
  EXCEPTION WHEN OTHERS THEN v_ts := plainto_tsquery('english', v_query); END;
  RETURN QUERY
  SELECT p.id, p.name, p.slug, COALESCE(p.image, p.thumbnail_url),
    p.price, p.compare_price, COALESCE(p.brand, ''),
    ts_rank(to_tsvector('english',
      COALESCE(p.name,'') || ' ' || COALESCE(p.description,'') || ' ' ||
      COALESCE(p.short_description,'') || ' ' || COALESCE(array_to_string(p.tags,' '),'')
    ), v_ts)
  FROM products p
  WHERE p.approval_status = 'approved' AND p.visibility_status = 'visible'
    AND (
      v_ts @@ to_tsvector('english',
        COALESCE(p.name,'') || ' ' || COALESCE(p.description,'') || ' ' ||
        COALESCE(p.short_description,'') || ' ' || COALESCE(array_to_string(p.tags,' '),'')
      ) OR p.name ILIKE '%' || v_query || '%'
    )
  ORDER BY relevance DESC, p.name
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION smart_search_products(text, int, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_active_festival_campaigns()
RETURNS TABLE (
  id uuid, name text, slug text, emoji text, description text,
  banner_image text, banner_link text, bg_color text, accent_color text,
  starts_at timestamptz, ends_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, slug, emoji, description, banner_image, banner_link,
    bg_color, accent_color, starts_at, ends_at
  FROM festival_campaigns
  WHERE (is_active = true OR auto_activate = true) AND starts_at <= now() AND ends_at >= now()
  ORDER BY starts_at
$$;
GRANT EXECUTE ON FUNCTION get_active_festival_campaigns() TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_revenue_analytics(
  p_from timestamptz DEFAULT now() - interval '30 days',
  p_to   timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_orders',   COUNT(DISTINCT o.id),
    'total_revenue',  COALESCE(SUM(o.total), 0),
    'avg_order_value',ROUND(COALESCE(AVG(o.total), 0)::numeric, 2),
    'top_searches', (
      SELECT COALESCE(jsonb_agg(row_to_json(ts)), '[]') FROM (
        SELECT query, COUNT(*)::int AS search_count, ROUND(AVG(result_count))::int AS avg_results
        FROM smart_search_logs WHERE created_at BETWEEN p_from AND p_to
        GROUP BY query ORDER BY search_count DESC LIMIT 10
      ) ts
    ),
    'zero_result_searches', (
      SELECT COALESCE(jsonb_agg(row_to_json(zs)), '[]') FROM (
        SELECT query, COUNT(*)::int AS search_count
        FROM smart_search_logs WHERE created_at BETWEEN p_from AND p_to AND result_count = 0
        GROUP BY query ORDER BY search_count DESC LIMIT 10
      ) zs
    )
  ) INTO v_result
  FROM orders o
  WHERE o.created_at BETWEEN p_from AND p_to AND o.order_status NOT IN ('cancelled','failed');
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
GRANT EXECUTE ON FUNCTION get_revenue_analytics(timestamptz, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION get_my_reorder_reminders(p_days_ahead int DEFAULT 14)
RETURNS TABLE (
  product_id uuid, name text, slug text, image text,
  price numeric, predicted_reorder_at timestamptz,
  days_until_reorder int, times_ordered int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.slug, COALESCE(p.image, p.thumbnail_url),
    p.price, rp.predicted_reorder_at,
    EXTRACT(DAY FROM (rp.predicted_reorder_at - now()))::int,
    rp.times_ordered
  FROM reorder_predictions rp
  JOIN products p ON p.id = rp.product_id
  WHERE rp.user_id = auth.uid()
    AND rp.predicted_reorder_at <= now() + (p_days_ahead || ' days')::interval
    AND rp.predicted_reorder_at >= now() - interval '3 days'
    AND p.approval_status = 'approved' AND p.visibility_status = 'visible'
  ORDER BY rp.predicted_reorder_at
$$;
GRANT EXECUTE ON FUNCTION get_my_reorder_reminders(int) TO authenticated;

CREATE OR REPLACE FUNCTION classify_products_for_occasions()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int := 0; v_occ RECORD; v_prod RECORD;
BEGIN
  FOR v_occ IN SELECT id, keywords FROM occasions WHERE is_active = true LOOP
    FOR v_prod IN
      SELECT DISTINCT p.id FROM products p
      WHERE p.approval_status = 'approved' AND p.visibility_status = 'visible'
        AND EXISTS (
          SELECT 1 FROM unnest(v_occ.keywords) kw
          WHERE lower(p.name) ILIKE '%' || lower(kw) || '%'
             OR lower(COALESCE(p.description,'')) ILIKE '%' || lower(kw) || '%'
             OR lower(COALESCE(array_to_string(p.tags,' '),'')) ILIKE '%' || lower(kw) || '%'
        )
    LOOP
      INSERT INTO occasion_products (occasion_id, product_id, source)
      VALUES (v_occ.id, v_prod.id, 'ai') ON CONFLICT DO NOTHING;
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  UPDATE occasions o SET product_count = (SELECT COUNT(*) FROM occasion_products op WHERE op.occasion_id = o.id);
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION classify_products_for_occasions() TO authenticated;
