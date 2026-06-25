/*
  # Fix RLS Policy Performance - Auth Function Optimization

  1. Security Changes
    - Update policies on `store_category_mapping` to use `(select auth.uid())`
    - Update policies on `hub_sync_jobs` to use `(select auth.uid())`
    - Update policies on `system_config` to use `(select auth.uid())`
    - Update policies on `store_api_keys` to use `(select auth.uid())`

  2. Performance Notes
    - Using `(select auth.uid())` caches the auth function result for the entire query
    - Prevents re-evaluation of auth functions for each row
*/

-- store_category_mapping policies
DROP POLICY IF EXISTS "Admins can view all category mappings" ON public.store_category_mapping;
DROP POLICY IF EXISTS "Admins can insert category mappings" ON public.store_category_mapping;
DROP POLICY IF EXISTS "Admins can update category mappings" ON public.store_category_mapping;
DROP POLICY IF EXISTS "Admins can delete category mappings" ON public.store_category_mapping;

CREATE POLICY "Admins can view all category mappings"
  ON public.store_category_mapping
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can insert category mappings"
  ON public.store_category_mapping
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update category mappings"
  ON public.store_category_mapping
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can delete category mappings"
  ON public.store_category_mapping
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
    )
  );

-- hub_sync_jobs policies
DROP POLICY IF EXISTS "Admins can select hub_sync_jobs" ON public.hub_sync_jobs;
DROP POLICY IF EXISTS "Admins can insert hub_sync_jobs" ON public.hub_sync_jobs;
DROP POLICY IF EXISTS "Admins can update hub_sync_jobs" ON public.hub_sync_jobs;

CREATE POLICY "Admins can select hub_sync_jobs"
  ON public.hub_sync_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );

CREATE POLICY "Admins can insert hub_sync_jobs"
  ON public.hub_sync_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );

CREATE POLICY "Admins can update hub_sync_jobs"
  ON public.hub_sync_jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );

-- system_config policies
DROP POLICY IF EXISTS "Admins can select system_config" ON public.system_config;
DROP POLICY IF EXISTS "Admins can insert system_config" ON public.system_config;
DROP POLICY IF EXISTS "Admins can update system_config" ON public.system_config;

CREATE POLICY "Admins can select system_config"
  ON public.system_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );

CREATE POLICY "Admins can insert system_config"
  ON public.system_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );

CREATE POLICY "Admins can update system_config"
  ON public.system_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );

-- store_api_keys policies
DROP POLICY IF EXISTS "Admins can select store_api_keys" ON public.store_api_keys;
DROP POLICY IF EXISTS "Admins can insert store_api_keys" ON public.store_api_keys;
DROP POLICY IF EXISTS "Admins can update store_api_keys" ON public.store_api_keys;
DROP POLICY IF EXISTS "Admins can delete store_api_keys" ON public.store_api_keys;

CREATE POLICY "Admins can select store_api_keys"
  ON public.store_api_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );

CREATE POLICY "Admins can insert store_api_keys"
  ON public.store_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );

CREATE POLICY "Admins can update store_api_keys"
  ON public.store_api_keys
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );

CREATE POLICY "Admins can delete store_api_keys"
  ON public.store_api_keys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = (select auth.uid()) AND au.is_active = true
    )
  );