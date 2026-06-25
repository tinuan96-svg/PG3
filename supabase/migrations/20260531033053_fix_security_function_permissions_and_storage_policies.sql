/*
  # Fix Security Issues — Storage Policies and Function Permissions

  ## Changes

  ### 1. Storage Bucket Listing Policies Removed
  Drops broad SELECT ("list all files") policies from public storage buckets.
  Public buckets serve object content via direct URL without needing list-all
  policies — removing these prevents clients from enumerating all stored files.
  - "Public can view banners"
  - "Public can view product images"
  - "Public can view user avatars"

  ### 2. Revoke EXECUTE from anon on all SECURITY DEFINER functions
  Anonymous (unauthenticated) users must never be able to call admin RPCs,
  profile lookups, or any internal trigger helpers via the REST API.

  ### 3. Revoke EXECUTE from authenticated on trigger/utility functions
  Functions used exclusively as DB triggers or internal helpers should not be
  callable by any application role via the REST API. Revoking EXECUTE from
  `authenticated` does NOT affect the triggers — triggers fire as the database
  owner regardless of role EXECUTE grants.

  ### Note on pg_net
  pg_net v0.x does not support ALTER EXTENSION SET SCHEMA and all its functions
  already live in the dedicated `net` schema, not `public`. The extension
  registration in `public` is a Supabase platform detail that cannot be changed
  without dropping the extension, which would break internal Supabase services.
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Remove broad storage listing policies from public buckets
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can view banners"        ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view user avatars"   ON storage.objects;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Revoke EXECUTE from anon on all SECURITY DEFINER functions
-- ─────────────────────────────────────────────────────────────────────────────

-- Admin RPCs
REVOKE EXECUTE ON FUNCTION public.approve_product(uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_product(uuid)                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_product_to_draft(uuid)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_product_draft(uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_draft_products()              FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_product_diagnostics()         FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin()                              FROM anon;

-- User-facing RPCs
REVOKE EXECUTE ON FUNCTION public.get_my_profile()                        FROM anon;

-- Trigger / utility functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user()          FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_order_number()    FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_set_order_number()     FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()          FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Revoke EXECUTE from authenticated on internal trigger/utility functions
--    These are invoked by DB triggers only — never directly by the app.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.handle_new_user()          FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_number()    FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_set_order_number()     FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()          FROM authenticated;
