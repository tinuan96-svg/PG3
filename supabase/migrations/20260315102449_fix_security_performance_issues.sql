/*
  # Fix Security and Performance Issues

  ## Summary
  Comprehensive fix for all Supabase security advisor warnings.

  ## Changes

  ### 1. Missing foreign key indexes (unindexed FK warnings)
  - Add index on import_logs(connection_id)
  - Add index on order_items(order_id)
  - Add index on orders(user_id)
  - Add index on product_feed_items(product_id)
  - Add index on referrals(referrer_id)
  - Add index on wallet_transactions(user_id)

  ### 2. Drop unused indexes
  - idx_order_items_product_id
  - idx_products_brand_id
  - idx_products_category_id
  - idx_referrals_referee_id

  ### 3. Fix Auth RLS Initialization Plan (wrap auth functions with SELECT)
  All auth.uid() and auth.jwt() calls in RLS policies are wrapped with (select ...)
  so they are evaluated once per query instead of once per row.

  ### 4. Consolidate multiple permissive policies
  - profiles SELECT: merge "Users can view own profile" + "Admins can view all profiles" into one
  - profiles UPDATE: merge "Users can update own profile" + "Admins can update all profiles" into one
  - orders SELECT: merge "Users and admins can view orders" + "Admins can view all orders" into one
    (also removes the recursive profiles table reference in the old combined policy)

  ### 5. Fix handle_new_user function search_path
  Add SET search_path = '' and use fully qualified table names to prevent search_path injection.
*/

-- =====================================================
-- 1. ADD MISSING FK INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_import_logs_connection_id ON public.import_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_product_feed_items_product_id ON public.product_feed_items(product_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);

-- =====================================================
-- 2. DROP UNUSED INDEXES
-- =====================================================
DROP INDEX IF EXISTS public.idx_order_items_product_id;
DROP INDEX IF EXISTS public.idx_products_brand_id;
DROP INDEX IF EXISTS public.idx_products_category_id;
DROP INDEX IF EXISTS public.idx_referrals_referee_id;

-- =====================================================
-- 3 + 4. FIX PROFILES RLS: CONSOLIDATED + OPTIMIZED
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Profiles viewable by owner or admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Profiles updatable by owner or admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (select auth.uid()) = id
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- =====================================================
-- 3 + 4. FIX ORDERS RLS: CONSOLIDATED + OPTIMIZED
-- =====================================================
DROP POLICY IF EXISTS "Users and admins can view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Orders viewable by owner or admin"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 5. FIX handle_new_user FUNCTION SEARCH PATH
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  ref_code text;
BEGIN
  ref_code := public.generate_referral_code_fn();

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
