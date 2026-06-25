/*
  # Add get_pocket_grocery_brand_counts RPC

  Returns brand slug + product count for brands that have active products
  assigned to the pocket-grocery store. Used by the brands page to show
  real brands from the database instead of a hardcoded list.
*/

CREATE OR REPLACE FUNCTION get_pocket_grocery_brand_counts()
RETURNS TABLE (brand_slug text, product_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.slug AS brand_slug, COUNT(p.id)::bigint AS product_count
  FROM brands b
  JOIN products p ON p.brand_id = b.id AND p.is_active = true
  JOIN store_products sp ON sp.product_id = p.id AND sp.is_active = true
  JOIN stores s ON s.id = sp.store_id AND s.slug = 'pocket-grocery'
  GROUP BY b.slug;
$$;

GRANT EXECUTE ON FUNCTION get_pocket_grocery_brand_counts() TO anon, authenticated;
