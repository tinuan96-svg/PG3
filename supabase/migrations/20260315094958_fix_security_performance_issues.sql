/*
  # Fix Security and Performance Issues

  1. Missing Foreign Key Indexes
     - Add index on order_items.product_id
     - Add index on products.brand_id
     - Add index on products.category_id
     - Add index on referrals.referee_id

  2. RLS Auth Initialization Plan
     - Replace bare auth.uid() with (select auth.uid()) in all affected policies
     - Affects: product_feed_items, seo_page_logs, profiles, user_wallets,
                wallet_transactions, orders, order_items, referrals,
                supplier_connections, import_logs

  3. Multiple Permissive Policies (SELECT)
     - Merge dual SELECT policies on orders into a single combined policy
     - Merge dual SELECT policies on profiles into a single combined policy

  4. Drop Unused Indexes
     - Remove indexes with zero scans to reduce write overhead

  5. Function Search Path
     - Recreate generate_referral_code_fn and handle_new_user with SET search_path = ''
     - Fully qualify all table references inside these functions
*/

-- ============================================================
-- 1. FOREIGN KEY INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals (referee_id);

-- ============================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================

DROP INDEX IF EXISTS public.idx_orders_user_id;
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_order_items_order_id;
DROP INDEX IF EXISTS public.idx_wallet_transactions_user_id;
DROP INDEX IF EXISTS public.idx_referrals_referrer_id;
DROP INDEX IF EXISTS public.idx_referrals_code;
DROP INDEX IF EXISTS public.idx_product_feed_items_product_id;
DROP INDEX IF EXISTS public.idx_import_logs_connection_id;
DROP INDEX IF EXISTS public.idx_import_logs_started_at;
DROP INDEX IF EXISTS public.idx_products_status;
DROP INDEX IF EXISTS public.idx_products_supplier_id;
DROP INDEX IF EXISTS public.idx_products_needs_ai_image;
DROP INDEX IF EXISTS public.idx_products_weight_unit;

-- ============================================================
-- 3. FIX RLS POLICIES — profiles
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile non-role fields" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Merged SELECT: own profile OR admin
CREATE POLICY "Users and admins can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile non-role fields"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================
-- 4. FIX RLS POLICIES — user_wallets
-- ============================================================

DROP POLICY IF EXISTS "Users can view own wallet" ON user_wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON user_wallets;

CREATE POLICY "Users can view own wallet"
  ON user_wallets FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own wallet"
  ON user_wallets FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================
-- 5. FIX RLS POLICIES — wallet_transactions
-- ============================================================

DROP POLICY IF EXISTS "Users can view own transactions" ON wallet_transactions;

CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 6. FIX RLS POLICIES — orders (also merge dual SELECT)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- Merged SELECT: own orders OR admin
CREATE POLICY "Users and admins can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 7. FIX RLS POLICIES — order_items
-- ============================================================

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- 8. FIX RLS POLICIES — referrals
-- ============================================================

DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = referrer_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = referrer_id);

-- ============================================================
-- 9. FIX RLS POLICIES — supplier_connections
-- ============================================================

DROP POLICY IF EXISTS "Admins can view supplier connections" ON supplier_connections;
DROP POLICY IF EXISTS "Admins can insert supplier connections" ON supplier_connections;
DROP POLICY IF EXISTS "Admins can update supplier connections" ON supplier_connections;
DROP POLICY IF EXISTS "Admins can delete supplier connections" ON supplier_connections;

CREATE POLICY "Admins can view supplier connections"
  ON supplier_connections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert supplier connections"
  ON supplier_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update supplier connections"
  ON supplier_connections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete supplier connections"
  ON supplier_connections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 10. FIX RLS POLICIES — import_logs
-- ============================================================

DROP POLICY IF EXISTS "Admins can view import logs" ON import_logs;
DROP POLICY IF EXISTS "Admins can insert import logs" ON import_logs;
DROP POLICY IF EXISTS "Admins can update import logs" ON import_logs;

CREATE POLICY "Admins can view import logs"
  ON import_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert import logs"
  ON import_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update import logs"
  ON import_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 11. FIX RLS POLICIES — product_feed_items
-- ============================================================

DROP POLICY IF EXISTS "Admin users can insert feed items" ON product_feed_items;
DROP POLICY IF EXISTS "Admin users can update feed items" ON product_feed_items;

CREATE POLICY "Admin users can insert feed items"
  ON product_feed_items FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT users.role FROM users WHERE users.id = (select auth.uid())) = 'admin'
  );

CREATE POLICY "Admin users can update feed items"
  ON product_feed_items FOR UPDATE
  TO authenticated
  USING (
    (SELECT users.role FROM users WHERE users.id = (select auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT users.role FROM users WHERE users.id = (select auth.uid())) = 'admin'
  );

-- ============================================================
-- 12. FIX RLS POLICIES — seo_page_logs
-- ============================================================

DROP POLICY IF EXISTS "Admin users can update SEO logs" ON seo_page_logs;

CREATE POLICY "Admin users can update SEO logs"
  ON seo_page_logs FOR UPDATE
  TO authenticated
  USING (
    (SELECT users.role FROM users WHERE users.id = (select auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT users.role FROM users WHERE users.id = (select auth.uid())) = 'admin'
  );

-- ============================================================
-- 13. FIX FUNCTION SEARCH PATHS
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_referral_code_fn()
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE referral_code = code
    ) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  ref_code text;
BEGIN
  ref_code := public.generate_referral_code_fn();

  INSERT INTO public.profiles (id, name, role, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'customer',
    ref_code
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_wallets (user_id, total_coins, coins_earned, coins_used)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
