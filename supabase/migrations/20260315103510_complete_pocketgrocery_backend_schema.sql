/*
  # Complete PocketGrocery Backend Schema

  ## Summary
  Fills in all missing schema components to complete the PocketGrocery ecommerce backend.

  ## New Tables

  ### 1. product_variations
  Stores weight/size variants for products (e.g. 5kg, 10kg bags of rice).

  ### 2. supplier_products
  Staging table for raw supplier feed data before normalization into the products table.

  ### 3. seo_pages
  Programmatic SEO landing pages with title, slug, meta fields, and content.

  ## Modified Tables

  ### order_items
  - Added variation_id (uuid, nullable FK to product_variations)

  ## New Views

  ### wallets
  Convenience view over user_wallets presenting balance = total_coins.

  ## Functions & Triggers
  - Creates update_updated_at_column() helper if it doesn't exist
  - Attaches updated_at trigger to seo_pages

  ## Admin User
  - Creates info@pocketgrocery.com with role = admin
  - Sets app_metadata.role = admin for JWT-based RLS
  - Creates profile and wallet records

  ## Security
  - RLS enabled on all new tables with optimized (select auth.jwt()) pattern
*/

-- =====================================================
-- 0. ENSURE update_updated_at_column FUNCTION EXISTS
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 1. PRODUCT VARIATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_variations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_label text        NOT NULL DEFAULT '',
  weight          numeric(10,3),
  price           numeric(10,2) NOT NULL DEFAULT 0,
  stock_quantity  integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_product_variations_product_id
  ON public.product_variations(product_id);

CREATE POLICY "Product variations are publicly readable"
  ON public.product_variations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert product variations"
  ON public.product_variations FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update product variations"
  ON public.product_variations FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete product variations"
  ON public.product_variations FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 2. ADD variation_id TO order_items
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'order_items'
      AND column_name  = 'variation_id'
  ) THEN
    ALTER TABLE public.order_items
      ADD COLUMN variation_id uuid
        REFERENCES public.product_variations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 3. SUPPLIER PRODUCTS TABLE (raw feed staging)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_product_id text        NOT NULL DEFAULT '',
  name                text        NOT NULL DEFAULT '',
  brand               text        NOT NULL DEFAULT '',
  price               numeric(10,2),
  stock               integer     NOT NULL DEFAULT 0,
  connection_id       uuid        REFERENCES public.supplier_connections(id) ON DELETE SET NULL,
  normalized          boolean     NOT NULL DEFAULT false,
  last_updated        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_supplier_products_connection_id
  ON public.supplier_products(connection_id);

CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id
  ON public.supplier_products(supplier_product_id);

CREATE INDEX IF NOT EXISTS idx_supplier_products_normalized
  ON public.supplier_products(normalized);

CREATE POLICY "Admins can select supplier products"
  ON public.supplier_products FOR SELECT
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert supplier products"
  ON public.supplier_products FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update supplier products"
  ON public.supplier_products FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete supplier products"
  ON public.supplier_products FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 4. SEO PAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL DEFAULT '',
  slug             text        UNIQUE NOT NULL,
  meta_title       text        NOT NULL DEFAULT '',
  meta_description text        NOT NULL DEFAULT '',
  content          text        NOT NULL DEFAULT '',
  published        boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_seo_pages_slug      ON public.seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_published ON public.seo_pages(published);

CREATE POLICY "Published SEO pages are publicly readable"
  ON public.seo_pages FOR SELECT
  TO anon, authenticated
  USING (
    published = true
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can insert seo pages"
  ON public.seo_pages FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update seo pages"
  ON public.seo_pages FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete seo pages"
  ON public.seo_pages FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table  = 'seo_pages'
      AND trigger_name        = 'update_seo_pages_updated_at'
  ) THEN
    CREATE TRIGGER update_seo_pages_updated_at
      BEFORE UPDATE ON public.seo_pages
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 5. WALLETS VIEW (convenience alias for user_wallets)
-- =====================================================
CREATE OR REPLACE VIEW public.wallets AS
SELECT
  id,
  user_id,
  total_coins AS balance,
  updated_at
FROM public.user_wallets;

-- =====================================================
-- 6. ADMIN USER SETUP
-- =====================================================
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'info@pocketgrocery.com';

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      is_sso_user,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'info@pocketgrocery.com',
      crypt('Pocket@123', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
      '{"name": "PocketGrocery Admin"}'::jsonb,
      false,
      false,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    UPDATE auth.users
    SET
      raw_app_meta_data  = '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
      email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = admin_id;
  END IF;

  INSERT INTO public.profiles (id, name, email, role)
  VALUES (admin_id, 'PocketGrocery Admin', 'info@pocketgrocery.com', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  INSERT INTO public.user_wallets (user_id, total_coins, coins_earned, coins_used)
  VALUES (admin_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END $$;
