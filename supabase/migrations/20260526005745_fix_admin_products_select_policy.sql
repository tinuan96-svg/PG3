/*
  # Fix admin products SELECT policy

  The existing RLS policies on products are preventing admin users from
  seeing all products in the admin panel. The "Users can view products"
  policy allows admins with app_metadata.role='admin', but is_admin=true
  is not checked there. This migration adds a dedicated admin full-access
  SELECT policy using both role and is_admin checks, and creates a
  security-definer RPC function for admin product listing to bypass RLS
  entirely for admin queries.

  Changes:
  1. Drop conflicting/redundant SELECT policies
  2. Add clean admin SELECT policy (is_admin=true in app_metadata)
  3. Add public SELECT policy for storefront (active + approved + price > 0)
  4. Create get_admin_products RPC for safe admin product listing
*/

-- Drop old conflicting SELECT policies
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view active products" ON products;
DROP POLICY IF EXISTS "Anon can view products" ON products;

-- Public storefront: active, approved, not deleted, price > 0
CREATE POLICY "Public storefront product view"
  ON products FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND COALESCE(is_deleted, false) = false
    AND approval_status = 'approved'
    AND price > 0
  );

-- Admin full access: all products including drafts, inactive, 0 price
CREATE POLICY "Admin full product view"
  ON products FOR SELECT
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true)
    OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

-- RPC for admin product listing (security definer bypasses RLS entirely)
CREATE OR REPLACE FUNCTION get_admin_products(
  p_search text DEFAULT NULL,
  p_status text DEFAULT 'all',
  p_stock_status text DEFAULT 'all',
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
  v_sort_sql text;
  v_total bigint;
BEGIN
  -- Verify caller is admin
  IF NOT (
    ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true)
    OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Count total
  SELECT COUNT(*) INTO v_total
  FROM products p
  WHERE
    COALESCE(p.is_deleted, false) = false
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.slug ILIKE '%' || p_search || '%')
    AND (p_status = 'all' OR (p_status = 'active' AND p.is_active = true) OR (p_status = 'inactive' AND p.is_active = false))
    AND (p_stock_status = 'all'
         OR (p_stock_status = 'in_stock' AND p.stock > 0)
         OR (p_stock_status = 'out_of_stock' AND p.stock <= 0 AND COALESCE(p.allow_backorder, false) = false))
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_price_min IS NULL OR p.price >= p_price_min)
    AND (p_price_max IS NULL OR p.price <= p_price_max);

  RETURN QUERY EXECUTE format(
    'SELECT
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
      %s::bigint AS total_count
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE
      COALESCE(p.is_deleted, false) = false
      AND ($1 IS NULL OR p.name ILIKE ''%%'' || $1 || ''%%'' OR p.slug ILIKE ''%%'' || $1 || ''%%'')
      AND ($2 = ''all'' OR ($2 = ''active'' AND p.is_active = true) OR ($2 = ''inactive'' AND p.is_active = false))
      AND ($3 = ''all''
           OR ($3 = ''in_stock'' AND p.stock > 0)
           OR ($3 = ''out_of_stock'' AND p.stock <= 0 AND COALESCE(p.allow_backorder, false) = false))
      AND ($4 IS NULL OR p.brand_id = $4)
      AND ($5 IS NULL OR p.category_id = $5)
      AND ($6 IS NULL OR p.price >= $6)
      AND ($7 IS NULL OR p.price <= $7)
    ORDER BY p.%I %s
    LIMIT $8 OFFSET $9',
    v_total,
    CASE WHEN p_sort_dir = 'asc' THEN 'ASC' ELSE 'DESC' END
  )
  USING p_search, p_status, p_stock_status, p_brand_id, p_category_id,
        p_price_min, p_price_max, p_limit, p_offset,
        p_sort_field;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_products TO authenticated;
