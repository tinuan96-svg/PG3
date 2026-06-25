/*
  # Fix infinite recursion in product_variants RLS policy

  ## Problem
  "Public can view active product variants" subqueries the products table.
  The products policy subqueries product_variants.
  The store_products policy also subqueries product_variants.
  Calling any RPC as anon triggers infinite recursion → zero products returned.

  ## Fix
  Remove the back-reference to products. Variants are visible if is_active = true.
  The parent product's visibility is already enforced by the products RLS policy.
*/

DROP POLICY IF EXISTS "Public can view active product variants" ON product_variants;

CREATE POLICY "Public can view active product variants"
  ON product_variants
  FOR SELECT
  TO anon, authenticated
  USING (COALESCE(is_active, true) = true);
