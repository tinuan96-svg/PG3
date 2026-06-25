/*
  # Fix get_admin_products RPC null parameter handling

  Update the RPC to treat NULL values for p_status and p_stock_status
  the same as 'all', so the frontend can pass null instead of 'all'.
*/

CREATE OR REPLACE FUNCTION get_admin_products(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_stock_status text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_sort_field text DEFAULT 'created_at',
  p_sort_dir text DEFAULT 'desc',
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  original_price numeric,
  cost_price numeric,
  profit_margin_percent numeric,
  stock int,
  is_active boolean,
  is_deleted boolean,
  is_deal boolean,
  allow_backorder boolean,
  image_url text,
  image_main text,
  gallery_images text[],
  seo_title text,
  seo_meta_description text,
  supplier_id uuid,
  source_product_id text,
  sync_status text,
  approval_status text,
  approved_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  category_id uuid,
  brand_id uuid,
  brand_name text,
  brand_slug text,
  category_name text,
  category_slug text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
BEGIN
  -- Verify caller is admin
  IF NOT (
    COALESCE(((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean), false) = true
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Count matching rows
  SELECT COUNT(*) INTO v_total
  FROM products p
  WHERE
    COALESCE(p.is_deleted, false) = false
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR p_status = 'all'
         OR (p_status = 'active' AND p.is_active = true)
         OR (p_status = 'inactive' AND p.is_active = false))
    AND (p_stock_status IS NULL OR p_stock_status = 'all'
         OR (p_stock_status = 'in_stock' AND p.stock > 0)
         OR (p_stock_status = 'out_of_stock' AND p.stock <= 0 AND COALESCE(p.allow_backorder, false) = false))
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_price_min IS NULL OR p.price >= p_price_min)
    AND (p_price_max IS NULL OR p.price <= p_price_max);

  RETURN QUERY
  SELECT
    p.id, p.name, p.slug, p.description,
    p.price, p.original_price, p.cost_price, p.profit_margin_percent,
    p.stock, p.is_active, p.is_deleted, p.is_deal, p.allow_backorder,
    p.image_url, p.image_main, p.gallery_images,
    p.seo_title, p.seo_meta_description,
    p.supplier_id, p.source_product_id, p.sync_status,
    p.approval_status, p.approved_at, p.created_at, p.updated_at,
    p.category_id, p.brand_id,
    b.name AS brand_name, b.slug AS brand_slug,
    c.name AS category_name, c.slug AS category_slug,
    v_total AS total_count
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE
    COALESCE(p.is_deleted, false) = false
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR p_status = 'all'
         OR (p_status = 'active' AND p.is_active = true)
         OR (p_status = 'inactive' AND p.is_active = false))
    AND (p_stock_status IS NULL OR p_stock_status = 'all'
         OR (p_stock_status = 'in_stock' AND p.stock > 0)
         OR (p_stock_status = 'out_of_stock' AND p.stock <= 0 AND COALESCE(p.allow_backorder, false) = false))
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_price_min IS NULL OR p.price >= p_price_min)
    AND (p_price_max IS NULL OR p.price <= p_price_max)
  ORDER BY
    CASE WHEN p_sort_field = 'name'       AND p_sort_dir = 'asc'  THEN p.name END ASC,
    CASE WHEN p_sort_field = 'name'       AND p_sort_dir = 'desc' THEN p.name END DESC,
    CASE WHEN p_sort_field = 'price'      AND p_sort_dir = 'asc'  THEN p.price END ASC,
    CASE WHEN p_sort_field = 'price'      AND p_sort_dir = 'desc' THEN p.price END DESC,
    CASE WHEN p_sort_field = 'stock'      AND p_sort_dir = 'asc'  THEN p.stock END ASC,
    CASE WHEN p_sort_field = 'stock'      AND p_sort_dir = 'desc' THEN p.stock END DESC,
    CASE WHEN p_sort_field = 'is_active'  AND p_sort_dir = 'asc'  THEN p.is_active::int END ASC,
    CASE WHEN p_sort_field = 'is_active'  AND p_sort_dir = 'desc' THEN p.is_active::int END DESC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_dir = 'asc'  THEN p.created_at END ASC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_dir = 'desc' THEN p.created_at END DESC,
    p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_products TO authenticated;
