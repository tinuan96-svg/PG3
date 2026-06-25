/*
  # Fix infinite recursion in RLS policies

  ## Problem
  Policies on `user_profiles` that check admin role contain:
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin')

  When any other table's policy (e.g. `categories`) also queries `user_profiles`
  to check admin role, Postgres evaluates the `user_profiles` SELECT policy,
  which in turn queries `user_profiles` again — causing infinite recursion.

  ## Solution
  1. Create a `SECURITY DEFINER` function `is_admin()` that bypasses RLS entirely
     when looking up the role. This breaks the recursion.
  2. Replace all admin-check policies on `user_profiles` and `categories` to
     call `is_admin()` instead of directly querying `user_profiles`.

  ## Changes
  - New function: `public.is_admin()` — SECURITY DEFINER, stable, no RLS bypass risk
  - Replaced policies on `user_profiles`: Admins can view/update all profiles
  - Replaced policies on `categories`: all four admin-write policies
*/

-- ─── 1. Create SECURITY DEFINER admin check function ────────────────────────
-- SECURITY DEFINER means it runs as the function owner (postgres), bypassing
-- the caller's RLS context. This is safe here because it only reads role — no
-- sensitive data is exposed — and the function is read-only (STABLE).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE auth_user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Grant execute to authenticated users so policies can call it
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ─── 2. Fix user_profiles policies ──────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can view all profiles"   ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());


-- ─── 3. Fix categories policies ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can manage categories"  ON categories;
DROP POLICY IF EXISTS "Admins can insert categories"  ON categories;
DROP POLICY IF EXISTS "Admins can update categories"  ON categories;
DROP POLICY IF EXISTS "Admins can delete categories"  ON categories;

CREATE POLICY "Admins can select categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (is_admin());
