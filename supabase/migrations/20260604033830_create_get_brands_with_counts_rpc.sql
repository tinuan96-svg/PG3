/*
  # Create get_brands_with_counts RPC

  ## Summary
  Creates a security-definer RPC that returns brands with their approved product
  counts. It merges two sources:

  1. The `brands` table (for logo, description, slug, is_active)
  2. The `products` table (for dynamic brand aggregation from products.brand)

  ## Logic
  - Aggregates distinct, non-empty brand values from products where
    approval_status = 'approved' AND visibility_status = 'visible'
  - LEFT JOINs the brands table to pick up logo_url, description, and slug
    when a matching record exists (matched case-insensitively on name)
  - Only includes brands with at least one qualifying product
  - Ordered by product_count DESC, then name ASC

  ## Why SECURITY DEFINER
  Products are RLS-protected. Running as the function owner bypasses the
  caller's RLS context, which is fine here because we're only exposing
  aggregate counts and public brand metadata — no sensitive row data.

  ## Grants
  Granted to `anon` so the public brands page (server-rendered, no auth) can call it.
*/

-- Drop and recreate to ensure clean state
DROP FUNCTION IF EXISTS get_brands_with_counts();

CREATE OR REPLACE FUNCTION get_brands_with_counts()
RETURNS TABLE (
  name        text,
  slug        text,
  description text,
  logo_url    text,
  product_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.brand                         AS name,
    -- Use brands.slug if matched, otherwise slugify the brand name
    COALESCE(
      b.slug,
      lower(regexp_replace(trim(p.brand), '[^a-zA-Z0-9]+', '-', 'g'))
    )                               AS slug,
    b.description                   AS description,
    b.logo_url                      AS logo_url,
    COUNT(*)                        AS product_count
  FROM products p
  LEFT JOIN brands b
    ON lower(trim(b.name)) = lower(trim(p.brand))
    AND b.is_active = true
  WHERE
    p.approval_status  = 'approved'
    AND p.visibility_status = 'visible'
    AND p.brand IS NOT NULL
    AND trim(p.brand) <> ''
  GROUP BY p.brand, b.slug, b.description, b.logo_url
  ORDER BY COUNT(*) DESC, p.brand ASC;
$$;

-- Grant execute to anon (public storefront) and authenticated users
GRANT EXECUTE ON FUNCTION get_brands_with_counts() TO anon;
GRANT EXECUTE ON FUNCTION get_brands_with_counts() TO authenticated;
