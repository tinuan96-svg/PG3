/*
  # Fix get_admin_products RPC — jsonb gallery cannot cast to text[]

  ## Root Cause
  The products.gallery column is type `jsonb`, but the RPC's RETURNS TABLE declares
  `gallery text[]`. PostgreSQL cannot implicitly cast jsonb → text[], so every call
  to get_admin_products throws:

      ERROR 42846: cannot cast type jsonb to text[]

  The admin products page catches this error silently and renders "Showing 0 of 0
  products / No products found" — even though 371 products exist.

  ## Fix
  Replace `p.gallery` in the dynamic SELECT with an explicit conversion:
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(
        COALESCE(p.gallery, '[]'::jsonb))), ARRAY[]::text[])

  This safely converts any jsonb array (including empty [] and NULL) to text[].

  ## Verification
  After this migration, get_admin_products() should return all 371 products
  (368 draft + 3 approved) when called by an authenticated admin.
*/

CREATE OR REPLACE FUNCTION get_admin_products(
  p_sort_field      text    DEFAULT 'created_at',
  p_sort_dir        text    DEFAULT 'desc',
  p_limit           integer DEFAULT 50,
  p_offset          integer DEFAULT 0,
  p_search          text    DEFAULT NULL,
  p_status          text    DEFAULT NULL,
  p_stock_status    text    DEFAULT NULL,
  p_approval_status text    DEFAULT NULL,
  p_brand           text    DEFAULT NULL,
  p_category_id     uuid    DEFAULT NULL,
  p_price_min       numeric DEFAULT NULL,
  p_price_max       numeric DEFAULT NULL
)
RETURNS TABLE (
  id                uuid,
  name              text,
  slug              text,
  description       text,
  short_description text,
  price             numeric,
  compare_price     numeric,
  cost_price        numeric,
  selling_price     numeric,
  markup_percentage numeric,
  profit_amount     numeric,
  stock_qty         integer,
  image             text,
  gallery           text[],
  seo_title         text,
  seo_description   text,
  sku               text,
  source_product_id text,
  approval_status   text,
  approved_at       timestamptz,
  created_at        timestamptz,
  synced_at         timestamptz,
  centralhub_status text,
  category_id       uuid,
  brand             text,
  featured          boolean,
  visibility_status text,
  weight_grams      numeric,
  barcode           text,
  needs_admin_review boolean,
  category_name     text,
  total_count       bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sort_col text;
BEGIN
  IF NOT is_admin() THEN
    RETURN;
  END IF;

  v_sort_col := CASE COALESCE(p_sort_field, 'created_at')
    WHEN 'name'            THEN 'p.name'
    WHEN 'price'           THEN 'p.price'
    WHEN 'stock_qty'       THEN 'p.stock_qty'
    WHEN 'approval_status' THEN 'p.approval_status'
    ELSE 'p.created_at'
  END;

  RETURN QUERY EXECUTE format(
    'SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.short_description,
      p.price,
      p.compare_price,
      p.cost_price,
      p.selling_price,
      p.markup_percentage,
      p.profit_amount,
      p.stock_qty,
      p.image,
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(p.gallery, ''[]''::jsonb))),
        ARRAY[]::text[]
      ) AS gallery,
      p.seo_title,
      p.seo_description,
      p.sku,
      p.source_product_id,
      p.approval_status,
      p.approved_at,
      p.created_at,
      p.synced_at,
      p.centralhub_status,
      p.category_id,
      p.brand,
      p.featured,
      p.visibility_status,
      p.weight_grams,
      p.barcode,
      p.needs_admin_review,
      c.name AS category_name,
      COUNT(*) OVER() AS total_count
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE ($1 IS NULL OR p.name ILIKE $1 OR p.sku ILIKE $1)
      AND ($2 IS NULL OR p.visibility_status = $2)
      AND ($3 IS NULL OR
           ($3 = ''in_stock''     AND p.stock_qty > 0) OR
           ($3 = ''out_of_stock'' AND p.stock_qty <= 0))
      AND ($4 IS NULL OR p.approval_status = $4)
      AND ($5 IS NULL OR p.brand ILIKE $5)
      AND ($6 IS NULL OR p.category_id = $6)
      AND ($7 IS NULL OR p.price >= $7)
      AND ($8 IS NULL OR p.price <= $8)
    ORDER BY %s %s NULLS LAST
    LIMIT $9 OFFSET $10',
    v_sort_col,
    CASE WHEN lower(COALESCE(p_sort_dir, 'desc')) = 'asc' THEN 'ASC' ELSE 'DESC' END
  )
  USING
    CASE WHEN p_search IS NOT NULL THEN '%' || p_search || '%' ELSE NULL END,
    p_status,
    p_stock_status,
    p_approval_status,
    CASE WHEN p_brand IS NOT NULL THEN '%' || p_brand || '%' ELSE NULL END,
    p_category_id,
    p_price_min,
    p_price_max,
    p_limit,
    p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_products(text, text, integer, integer, text, text, text, text, text, uuid, numeric, numeric) TO authenticated;
