/*
  # Fix RLS Policy Performance on store_products

  1. Security Changes
    - Drop and recreate 4 admin policies on `store_products` table
    - Replace `auth.uid()` with `(select auth.uid())` to prevent per-row evaluation
    - This optimization caches the auth function result for the entire query

  2. Notes
    - The policies retain the same permissions, only the performance is improved
    - Admin role check via raw_app_meta_data or raw_user_meta_data is preserved
*/

DROP POLICY IF EXISTS "Admins can delete store products" ON public.store_products;
DROP POLICY IF EXISTS "Admins can insert store products" ON public.store_products;
DROP POLICY IF EXISTS "Admins can read all store products" ON public.store_products;
DROP POLICY IF EXISTS "Admins can update store products" ON public.store_products;

CREATE POLICY "Admins can read all store products"
  ON public.store_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = (select auth.uid())
      AND (
        (u.raw_app_meta_data ->> 'role') = 'admin'
        OR (u.raw_user_meta_data ->> 'role') = 'admin'
      )
    )
  );

CREATE POLICY "Admins can insert store products"
  ON public.store_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = (select auth.uid())
      AND (
        (u.raw_app_meta_data ->> 'role') = 'admin'
        OR (u.raw_user_meta_data ->> 'role') = 'admin'
      )
    )
  );

CREATE POLICY "Admins can update store products"
  ON public.store_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = (select auth.uid())
      AND (
        (u.raw_app_meta_data ->> 'role') = 'admin'
        OR (u.raw_user_meta_data ->> 'role') = 'admin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = (select auth.uid())
      AND (
        (u.raw_app_meta_data ->> 'role') = 'admin'
        OR (u.raw_user_meta_data ->> 'role') = 'admin'
      )
    )
  );

CREATE POLICY "Admins can delete store products"
  ON public.store_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = (select auth.uid())
      AND (
        (u.raw_app_meta_data ->> 'role') = 'admin'
        OR (u.raw_user_meta_data ->> 'role') = 'admin'
      )
    )
  );