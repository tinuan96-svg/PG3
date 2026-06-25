/*
  # Add Brand Field & AI Content System

  1. New Columns
    - `products.brand` (text) — plain-text brand name, synced from CentralHub,
      editable by admin. Stored alongside brand_id (FK) for display flexibility.

  2. New Tables
    - `ai_content_logs` — audit trail for every AI generation action
      - product_id, admin_user_id, content_type, product_name, created_at

  3. Updated RPCs (drop + recreate — return type changed)
    - `get_admin_draft_products()` — now returns `brand` column
    - `save_product_draft()` — now accepts `p_brand text`
    - `approve_product()` — now accepts `p_brand text`

  4. Security
    - RLS on ai_content_logs (admin only)
*/

-- ─── 1. Add brand text column to products ────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text;

-- ─── 2. ai_content_logs audit table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_content_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid        REFERENCES products(id) ON DELETE CASCADE,
  admin_user_id  uuid,
  content_type   text        NOT NULL,
  product_name   text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE ai_content_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_content_logs' AND policyname = 'Admins can manage ai content logs'
  ) THEN
    CREATE POLICY "Admins can manage ai content logs"
      ON ai_content_logs FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- ─── 3. get_admin_draft_products — add brand to return set ───────────────────
DROP FUNCTION IF EXISTS public.get_admin_draft_products();

CREATE OR REPLACE FUNCTION public.get_admin_draft_products()
RETURNS TABLE (
  id                 uuid,
  name               text,
  slug               text,
  brand              text,
  description        text,
  short_description  text,
  image              text,
  category_id        uuid,
  price              numeric,
  compare_price      numeric,
  approval_status    text,
  source_product_id  text,
  created_at         timestamptz,
  synced_at          timestamptz,
  seo_title          text,
  seo_description    text,
  seo_keywords       text,
  featured           boolean,
  visibility_status  text,
  stock_qty          integer,
  centralhub_status  text,
  weight_grams       numeric,
  barcode            text,
  sku                text,
  needs_admin_review boolean,
  category_name      text,
  category_uuid      uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    p.brand,
    p.description,
    p.short_description,
    p.image,
    p.category_id,
    p.price,
    p.compare_price,
    p.approval_status,
    p.source_product_id,
    p.created_at,
    p.synced_at,
    p.seo_title,
    p.seo_description,
    p.seo_keywords,
    p.featured,
    p.visibility_status,
    p.stock_qty,
    p.centralhub_status,
    p.weight_grams,
    p.barcode,
    p.sku,
    p.needs_admin_review,
    c.name AS category_name,
    c.id   AS category_uuid
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE
    is_admin()
    AND p.approval_status IN ('draft', 'rejected')
  ORDER BY
    p.needs_admin_review DESC,
    p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_draft_products() TO authenticated;

-- ─── 4. save_product_draft — add p_brand parameter ───────────────────────────
DROP FUNCTION IF EXISTS public.save_product_draft(uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.save_product_draft(
  p_id                uuid,
  p_name              text    DEFAULT NULL,
  p_short_description text    DEFAULT NULL,
  p_description       text    DEFAULT NULL,
  p_category_id       uuid    DEFAULT NULL,
  p_image             text    DEFAULT NULL,
  p_price             numeric DEFAULT NULL,
  p_compare_price     numeric DEFAULT NULL,
  p_seo_title         text    DEFAULT NULL,
  p_seo_description   text    DEFAULT NULL,
  p_seo_keywords      text    DEFAULT NULL,
  p_featured          boolean DEFAULT NULL,
  p_brand             text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE products SET
    name               = COALESCE(p_name,              name),
    short_description  = COALESCE(p_short_description, short_description),
    description        = COALESCE(p_description,       description),
    category_id        = COALESCE(p_category_id,       category_id),
    image              = COALESCE(p_image,              image),
    price              = COALESCE(p_price,              price),
    compare_price      = COALESCE(p_compare_price,      compare_price),
    seo_title          = COALESCE(p_seo_title,          seo_title),
    seo_description    = COALESCE(p_seo_description,    seo_description),
    seo_keywords       = COALESCE(p_seo_keywords,       seo_keywords),
    featured           = COALESCE(p_featured,           featured),
    brand              = COALESCE(p_brand,              brand),
    updated_at         = now()
  WHERE id = p_id AND approval_status IN ('draft', 'rejected');
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_product_draft(uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean, text) TO authenticated;

-- ─── 5. approve_product — add p_brand parameter ──────────────────────────────
DROP FUNCTION IF EXISTS public.approve_product(uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.approve_product(
  p_id                uuid,
  p_name              text    DEFAULT NULL,
  p_short_description text    DEFAULT NULL,
  p_description       text    DEFAULT NULL,
  p_category_id       uuid    DEFAULT NULL,
  p_image             text    DEFAULT NULL,
  p_price             numeric DEFAULT NULL,
  p_compare_price     numeric DEFAULT NULL,
  p_seo_title         text    DEFAULT NULL,
  p_seo_description   text    DEFAULT NULL,
  p_seo_keywords      text    DEFAULT NULL,
  p_featured          boolean DEFAULT NULL,
  p_brand             text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE products SET
    name               = COALESCE(p_name,              name),
    short_description  = COALESCE(p_short_description, short_description),
    description        = COALESCE(p_description,       description),
    category_id        = COALESCE(p_category_id,       category_id),
    image              = COALESCE(p_image,              image),
    price              = COALESCE(p_price,              price),
    compare_price      = COALESCE(p_compare_price,      compare_price),
    seo_title          = COALESCE(p_seo_title,          seo_title),
    seo_description    = COALESCE(p_seo_description,    seo_description),
    seo_keywords       = COALESCE(p_seo_keywords,       seo_keywords),
    featured           = COALESCE(p_featured,           featured),
    brand              = COALESCE(p_brand,              brand),
    approval_status    = 'approved',
    visibility_status  = 'visible',
    needs_admin_review = false,
    approved_at        = now(),
    approved_by        = auth.uid(),
    updated_at         = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_product(uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean, text) TO authenticated;
