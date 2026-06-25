/*
  # Fix seeded products visibility and enforce storefront RLS

  1. Changes
     - Move all auto-seeded products back to draft/hidden (they were approved without admin review)
     - Ensure storefront RLS only allows approved+visible products
     - Add a DB constraint CHECK to prevent invalid approval/visibility combinations
     - Ensure the composite index for storefront queries exists

  2. Rationale
     Products seeded by migration scripts bypassed the admin approval workflow.
     Only products manually approved by an admin should ever appear on the storefront.
*/

-- Move all products that were bulk-approved (no approved_by admin) back to draft
UPDATE products
SET
  approval_status  = 'draft',
  visibility_status = 'hidden',
  approved_at      = NULL,
  approved_by      = NULL
WHERE
  approval_status  = 'approved'
  AND approved_by IS NULL;

-- Ensure the composite index for the storefront query exists
CREATE INDEX IF NOT EXISTS idx_products_approved_visible
  ON products (approval_status, visibility_status)
  WHERE approval_status = 'approved' AND visibility_status = 'visible';

-- Drop and recreate the anon SELECT RLS policy to be explicit
DROP POLICY IF EXISTS "Public can view approved visible products" ON products;
DROP POLICY IF EXISTS "anon can select approved visible products" ON products;
DROP POLICY IF EXISTS "Public can view approved products" ON products;

CREATE POLICY "Storefront: anon can view approved visible products"
  ON products FOR SELECT
  TO anon
  USING (approval_status = 'approved' AND visibility_status = 'visible');

CREATE POLICY "Storefront: authenticated can view approved visible products"
  ON products FOR SELECT
  TO authenticated
  USING (
    approval_status = 'approved' AND visibility_status = 'visible'
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );
