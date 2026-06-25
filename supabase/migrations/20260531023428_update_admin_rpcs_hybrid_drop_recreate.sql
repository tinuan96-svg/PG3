/*
  # Update Admin RPCs for Hybrid CentralHub Integration

  Drop and recreate admin RPCs to add new fields from the hybrid integration:
  stock_qty, centralhub_status, weight_grams, barcode, sku, needs_admin_review.
*/

-- Drop old versions first (return type changed)
DROP FUNCTION IF EXISTS public.get_admin_draft_products();
DROP FUNCTION IF EXISTS public.get_admin_product_diagnostics();

-- ─── Draft products RPC ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_admin_draft_products()
RETURNS TABLE (
  id                 uuid,
  name               text,
  slug               text,
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
    c.name  AS category_name,
    c.id    AS category_uuid
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

-- ─── Diagnostics RPC ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_admin_product_diagnostics()
RETURNS TABLE (
  total                 bigint,
  draft                 bigint,
  approved              bigint,
  rejected              bigint,
  needs_review          bigint,
  low_stock             bigint,
  out_of_stock          bigint,
  last_synced_at        timestamptz,
  last_sync_error       text,
  centralhub_configured boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)                                                                   AS total,
    COUNT(*) FILTER (WHERE p.approval_status = 'draft')                       AS draft,
    COUNT(*) FILTER (WHERE p.approval_status = 'approved')                    AS approved,
    COUNT(*) FILTER (WHERE p.approval_status = 'rejected')                    AS rejected,
    COUNT(*) FILTER (WHERE p.needs_admin_review = true)                       AS needs_review,
    COUNT(*) FILTER (WHERE p.stock_qty > 0 AND p.stock_qty <= 10)             AS low_stock,
    COUNT(*) FILTER (WHERE p.stock_qty = 0 AND p.approval_status = 'approved') AS out_of_stock,
    MAX(p.synced_at)                                                            AS last_synced_at,
    NULL::text                                                                  AS last_sync_error,
    false::boolean                                                              AS centralhub_configured
  FROM products p;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_product_diagnostics() TO authenticated;

-- ─── approve_product: clears needs_admin_review ───────────────────────────────

CREATE OR REPLACE FUNCTION public.approve_product(
  p_id                uuid,
  p_name              text DEFAULT NULL,
  p_short_description text DEFAULT NULL,
  p_description       text DEFAULT NULL,
  p_category_id       uuid DEFAULT NULL,
  p_image             text DEFAULT NULL,
  p_price             numeric DEFAULT NULL,
  p_compare_price     numeric DEFAULT NULL,
  p_seo_title         text DEFAULT NULL,
  p_seo_description   text DEFAULT NULL,
  p_seo_keywords      text DEFAULT NULL,
  p_featured          boolean DEFAULT NULL
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
    name               = COALESCE(p_name, name),
    short_description  = COALESCE(p_short_description, short_description),
    description        = COALESCE(p_description, description),
    category_id        = COALESCE(p_category_id, category_id),
    image              = COALESCE(p_image, image),
    price              = COALESCE(p_price, price),
    compare_price      = COALESCE(p_compare_price, compare_price),
    seo_title          = COALESCE(p_seo_title, seo_title),
    seo_description    = COALESCE(p_seo_description, seo_description),
    seo_keywords       = COALESCE(p_seo_keywords, seo_keywords),
    featured           = COALESCE(p_featured, featured),
    approval_status    = 'approved',
    visibility_status  = 'visible',
    needs_admin_review = false,
    approved_at        = now(),
    approved_by        = auth.uid(),
    updated_at         = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_product(uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean) TO authenticated;
