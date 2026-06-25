/*
  # Product Approval System — New RPCs

  ## Summary
  Replaces the single unfiltered get_admin_draft_products() with four focused functions
  needed for the redesigned compact approval queue and full-screen edit modal.

  ## New Functions

  1. get_admin_approval_queue(search, filter, limit, offset)
     - Paginated product queue (25/page default)
     - Filters: all | draft | approved | rejected | missing_category | missing_image | missing_seo
     - Returns lightweight row per product + total_count for pagination

  2. get_admin_product_full(product_id)
     - Returns every editable field for one product (used by edit modal)
     - Does NOT touch approval status

  3. update_product_fields(product_id, ...fields)
     - Saves any product field regardless of approval_status
     - Replaces save_product_draft which was locked to draft/rejected only

  4. get_product_visibility_check(product_id)
     - Returns a diagnostic checklist (10 checks) showing exactly why a product
       is or is not visible on the storefront

  ## Notes
  - All functions are SECURITY DEFINER and call is_admin() for access control
  - Storefront visibility requires: approval_status='approved' AND visibility_status='visible'
    The existing approve_product() already sets both correctly
*/

-- ── 1. Paginated approval queue ───────────────────────────────────────────────

DROP FUNCTION IF EXISTS get_admin_approval_queue(text, text, int, int);

CREATE FUNCTION get_admin_approval_queue(
  p_search text  DEFAULT NULL,
  p_filter text  DEFAULT 'all',
  p_limit  int   DEFAULT 25,
  p_offset int   DEFAULT 0
)
RETURNS TABLE (
  id               uuid,
  name             text,
  slug             text,
  sku              text,
  brand            text,
  image            text,
  price            numeric,
  stock_qty        int,
  approval_status  text,
  visibility_status text,
  category_id      uuid,
  category_name    text,
  has_description  boolean,
  has_seo          boolean,
  has_image        boolean,
  has_category     boolean,
  needs_admin_review boolean,
  synced_at        timestamptz,
  approved_at      timestamptz,
  created_at       timestamptz,
  total_count      bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    COALESCE(p.sku,   '')  AS sku,
    COALESCE(p.brand, '')  AS brand,
    COALESCE(p.image, '')  AS image,
    COALESCE(p.price, 0)   AS price,
    p.stock_qty,
    p.approval_status,
    p.visibility_status,
    p.category_id,
    COALESCE(c.name, '')   AS category_name,
    (p.description IS NOT NULL AND length(trim(p.description)) > 0)  AS has_description,
    (p.seo_title   IS NOT NULL AND length(trim(p.seo_title))   > 0)  AS has_seo,
    (p.image       IS NOT NULL AND length(trim(p.image))       > 0)  AS has_image,
    (p.category_id IS NOT NULL)                                        AS has_category,
    p.needs_admin_review,
    p.synced_at,
    p.approved_at,
    p.created_at,
    COUNT(*) OVER()                                                     AS total_count
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE
    (
      p_search IS NULL OR p_search = '' OR
      p.name   ILIKE '%' || p_search || '%' OR
      p.sku    ILIKE '%' || p_search || '%' OR
      COALESCE(p.brand, '') ILIKE '%' || p_search || '%'
    )
    AND (
      p_filter IS NULL OR p_filter = '' OR p_filter = 'all'
      OR (p_filter = 'draft'            AND p.approval_status = 'draft')
      OR (p_filter = 'approved'         AND p.approval_status = 'approved')
      OR (p_filter = 'rejected'         AND p.approval_status = 'rejected')
      OR (p_filter = 'missing_category' AND p.category_id IS NULL)
      OR (p_filter = 'missing_image'    AND (p.image IS NULL OR trim(p.image) = ''))
      OR (p_filter = 'missing_seo'      AND (p.seo_title IS NULL OR trim(p.seo_title) = ''))
    )
  ORDER BY
    CASE p.approval_status
      WHEN 'draft'    THEN 0
      WHEN 'rejected' THEN 1
      ELSE 2
    END,
    p.needs_admin_review DESC,
    p.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_approval_queue(text, text, int, int) TO authenticated;


-- ── 2. Full product fetch for the edit modal ──────────────────────────────────

DROP FUNCTION IF EXISTS get_admin_product_full(uuid);

CREATE FUNCTION get_admin_product_full(p_id uuid)
RETURNS TABLE (
  id                   uuid,
  name                 text,
  slug                 text,
  brand                text,
  sku                  text,
  short_description    text,
  description          text,
  image                text,
  gallery              jsonb,
  category_id          uuid,
  category_name        text,
  price                numeric,
  compare_price        numeric,
  cost_price           numeric,
  selling_price        numeric,
  markup_percentage    numeric,
  stock_qty            int,
  weight_grams         numeric,
  barcode              text,
  unit                 text,
  warehouse_location   text,
  seo_title            text,
  seo_description      text,
  seo_keywords         text,
  featured             boolean,
  tags                 text[],
  show_on_homepage     boolean,
  is_flash_deal        boolean,
  deal_price           numeric,
  deal_ends_at         timestamptz,
  approval_status      text,
  visibility_status    text,
  approval_notes       text,
  needs_admin_review   boolean,
  centralhub_status    text,
  source_product_id    text,
  centralhub_product_id text,
  product_type         text,
  original_image_url   text,
  processed_image_url  text,
  thumbnail_url        text,
  synced_at            timestamptz,
  approved_at          timestamptz,
  created_at           timestamptz,
  updated_at           timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    COALESCE(p.brand,             '')        AS brand,
    COALESCE(p.sku,               '')        AS sku,
    COALESCE(p.short_description, '')        AS short_description,
    COALESCE(p.description,       '')        AS description,
    COALESCE(p.image,             '')        AS image,
    COALESCE(p.gallery,           '[]'::jsonb) AS gallery,
    p.category_id,
    COALESCE(c.name,              '')        AS category_name,
    COALESCE(p.price,             0)         AS price,
    COALESCE(p.compare_price,     0)         AS compare_price,
    COALESCE(p.cost_price,        0)         AS cost_price,
    COALESCE(p.selling_price,     0)         AS selling_price,
    p.markup_percentage,
    p.stock_qty,
    p.weight_grams,
    COALESCE(p.barcode,           '')        AS barcode,
    COALESCE(p.unit,              '')        AS unit,
    COALESCE(p.warehouse_location,'')        AS warehouse_location,
    COALESCE(p.seo_title,         '')        AS seo_title,
    COALESCE(p.seo_description,   '')        AS seo_description,
    COALESCE(p.seo_keywords,      '')        AS seo_keywords,
    p.featured,
    COALESCE(p.tags,              '{}'::text[]) AS tags,
    p.show_on_homepage,
    p.is_flash_deal,
    p.deal_price,
    p.deal_ends_at,
    p.approval_status,
    p.visibility_status,
    COALESCE(p.approval_notes,    '')        AS approval_notes,
    p.needs_admin_review,
    COALESCE(p.centralhub_status, 'active')  AS centralhub_status,
    COALESCE(p.source_product_id, '')        AS source_product_id,
    COALESCE(p.centralhub_product_id, '')    AS centralhub_product_id,
    COALESCE(p.product_type,      'simple')  AS product_type,
    p.original_image_url,
    p.processed_image_url,
    p.thumbnail_url,
    p.synced_at,
    p.approved_at,
    p.created_at,
    p.updated_at
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_product_full(uuid) TO authenticated;


-- ── 3. Update product fields (any approval_status) ────────────────────────────

DROP FUNCTION IF EXISTS update_product_fields(uuid, text, text, text, text, uuid, text, numeric, numeric, numeric, numeric, int, text, text, numeric, text, text, text, text, boolean, text[], text);

CREATE FUNCTION update_product_fields(
  p_id              uuid,
  p_name            text    DEFAULT NULL,
  p_brand           text    DEFAULT NULL,
  p_short_desc      text    DEFAULT NULL,
  p_description     text    DEFAULT NULL,
  p_category_id     uuid    DEFAULT NULL,
  p_image           text    DEFAULT NULL,
  p_price           numeric DEFAULT NULL,
  p_compare_price   numeric DEFAULT NULL,
  p_cost_price      numeric DEFAULT NULL,
  p_selling_price   numeric DEFAULT NULL,
  p_stock_qty       int     DEFAULT NULL,
  p_sku             text    DEFAULT NULL,
  p_barcode         text    DEFAULT NULL,
  p_weight_grams    numeric DEFAULT NULL,
  p_unit            text    DEFAULT NULL,
  p_seo_title       text    DEFAULT NULL,
  p_seo_description text    DEFAULT NULL,
  p_seo_keywords    text    DEFAULT NULL,
  p_featured        boolean DEFAULT NULL,
  p_tags            text[]  DEFAULT NULL,
  p_approval_notes  text    DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE products SET
    name              = COALESCE(p_name,            name),
    brand             = COALESCE(p_brand,           brand),
    short_description = COALESCE(p_short_desc,      short_description),
    description       = COALESCE(p_description,     description),
    category_id       = COALESCE(p_category_id,     category_id),
    image             = COALESCE(p_image,            image),
    price             = COALESCE(p_price,            price),
    compare_price     = COALESCE(p_compare_price,    compare_price),
    cost_price        = COALESCE(p_cost_price,       cost_price),
    selling_price     = COALESCE(p_selling_price,    selling_price),
    stock_qty         = COALESCE(p_stock_qty,        stock_qty),
    sku               = COALESCE(p_sku,              sku),
    barcode           = COALESCE(p_barcode,          barcode),
    weight_grams      = COALESCE(p_weight_grams,     weight_grams),
    unit              = COALESCE(p_unit,             unit),
    seo_title         = COALESCE(p_seo_title,        seo_title),
    seo_description   = COALESCE(p_seo_description,  seo_description),
    seo_keywords      = COALESCE(p_seo_keywords,     seo_keywords),
    featured          = COALESCE(p_featured,         featured),
    tags              = COALESCE(p_tags,             tags),
    approval_notes    = COALESCE(p_approval_notes,   approval_notes),
    updated_at        = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_product_fields(uuid, text, text, text, text, uuid, text, numeric, numeric, numeric, numeric, int, text, text, numeric, text, text, text, text, boolean, text[], text) TO authenticated;


-- ── 4. Per-product visibility diagnostics ────────────────────────────────────

DROP FUNCTION IF EXISTS get_product_visibility_check(uuid);

CREATE FUNCTION get_product_visibility_check(p_id uuid)
RETURNS TABLE (
  check_name text,
  passed     boolean,
  value      text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v products%ROWTYPE;
  v_cat_name text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v FROM products WHERE id = p_id;
  SELECT name INTO v_cat_name FROM categories WHERE id = v.category_id;

  RETURN QUERY VALUES
    ('Approval Status',
      v.approval_status = 'approved',
      v.approval_status),
    ('Visibility Status',
      v.visibility_status = 'visible',
      v.visibility_status),
    ('Has Image',
      v.image IS NOT NULL AND trim(v.image) != '',
      COALESCE(CASE WHEN length(v.image) > 40 THEN left(v.image,40)||'…' ELSE v.image END, 'none')),
    ('Has Category',
      v.category_id IS NOT NULL,
      COALESCE(v_cat_name, 'none')),
    ('Has Description',
      v.description IS NOT NULL AND trim(v.description) != '',
      CASE WHEN v.description IS NOT NULL AND trim(v.description) != '' THEN 'yes' ELSE 'no' END),
    ('Has SEO Title',
      v.seo_title IS NOT NULL AND trim(v.seo_title) != '',
      COALESCE(CASE WHEN length(v.seo_title) > 40 THEN left(v.seo_title,40)||'…' ELSE v.seo_title END, 'none')),
    ('Price Set',
      COALESCE(v.price, 0) > 0,
      COALESCE(v.price, 0)::text),
    ('In Stock',
      COALESCE(v.stock_qty, 0) > 0,
      COALESCE(v.stock_qty, 0)::text),
    ('CentralHub Active',
      v.centralhub_status = 'active',
      COALESCE(v.centralhub_status, 'unknown')),
    ('Visible On Storefront',
      v.approval_status = 'approved' AND v.visibility_status = 'visible',
      CASE WHEN v.approval_status = 'approved' AND v.visibility_status = 'visible'
           THEN 'YES — live on site' ELSE 'NO — not visible' END);
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_visibility_check(uuid) TO authenticated;
