/*
  # Fix Profiles RLS Infinite Recursion + Admin JWT Metadata

  ## Problem
  The "Admins can view all profiles" policy used `EXISTS (SELECT 1 FROM profiles ...)` 
  inside its own USING clause, causing infinite recursion on every SELECT to the profiles table.

  ## Changes

  ### 1. Profiles table
  - Add `email` column (text, nullable)
  - Drop ALL existing policies on profiles
  - Recreate clean policies that do NOT reference the profiles table
  - Admin access uses JWT app_metadata (no self-referencing query)

  ### 2. Orders table
  - Drop and recreate admin policies using JWT app_metadata instead of querying profiles

  ### 3. Admin user
  - Set `raw_app_meta_data` role = 'admin' for info@pocketgrocery.com
  - This allows `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'` to work in RLS

  ## Security
  - All user policies: auth.uid() = id (no recursion possible)
  - All admin policies: JWT claim check (no table query = no recursion)
  - RLS remains enabled on all tables
*/

-- =====================================================
-- 1. ADD EMAIL COLUMN TO PROFILES
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text DEFAULT '';
  END IF;
END $$;

-- =====================================================
-- 2. DROP ALL EXISTING POLICIES ON PROFILES
-- =====================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- =====================================================
-- 3. RECREATE CLEAN NON-RECURSIVE POLICIES ON PROFILES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile  
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (JWT claim - no recursion)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Admins can update all profiles (JWT claim - no recursion)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 4. FIX ORDERS ADMIN POLICIES (use JWT, not profiles table)
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 5. SET ADMIN JWT APP_METADATA FOR info@pocketgrocery.com
-- =====================================================
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'info@pocketgrocery.com';

-- Also ensure the profile row has role = admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'info@pocketgrocery.com');

-- =====================================================
-- 6. UPDATE handle_new_user TRIGGER TO STORE EMAIL
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  ref_code text;
BEGIN
  ref_code := generate_referral_code_fn();

  INSERT INTO public.profiles (id, name, email, role, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    'customer',
    ref_code
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_wallets (user_id, total_coins, coins_earned, coins_used)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
