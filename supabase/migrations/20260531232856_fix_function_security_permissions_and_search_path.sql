/*
  # Fix Security Issues: Function Permissions, Search Path, and pg_net Schema

  ## Summary
  Addresses all security advisor warnings:

  1. **Function Search Path Mutable** — `touch_updated_at` recreated with
     `SET search_path = public` to prevent search_path injection attacks.

  2. **Extension in Public Schema** — `pg_net` moved from `public` to the
     `extensions` schema using a safe DO block.

  3. **Public/Anon Can Execute SECURITY DEFINER Functions** — REVOKE EXECUTE
     from PUBLIC on all SECURITY DEFINER functions, then re-GRANT only to
     the specific roles that legitimately need each function:
     - Trigger functions: no direct-call grants (DB calls them internally)
     - Admin RPCs: `authenticated` only (functions internally enforce is_admin())
     - User RPCs: `authenticated` only
     - Guest-checkout RPCs: `anon` + `authenticated` (worldpay config needed
       for guest checkout without login)

  ## Security Notes
  - `get_worldpay_client_key` and `get_worldpay_wallet_config` intentionally
    keep `anon` EXECUTE because guest checkout loads the payment SDK before
    the user is logged in.
  - `is_admin()` keeps `authenticated` EXECUTE because it is called from RLS
    policy expressions evaluated for authenticated queries.
  - Trigger functions (`handle_new_user`, `trg_set_order_number`,
    `update_updated_at_column`, `touch_updated_at`, `generate_order_number`,
    `clear_other_default_addresses`, `rls_auto_enable`) are called by the
    database engine directly and need no user-facing EXECUTE grants.
*/

-- ─── 1. Fix touch_updated_at search_path ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── 2. Move pg_net from public to extensions schema ─────────────────────────
-- Uses a DO block so the migration does not abort if pg_net is already moved
-- or does not support relocation on this platform.

DO $$
BEGIN
  CREATE SCHEMA IF NOT EXISTS extensions;
  ALTER EXTENSION pg_net SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_net schema move skipped: %', SQLERRM;
END;
$$;

-- ─── 3. Strip all PUBLIC grants from SECURITY DEFINER functions ───────────────
-- REVOKE from PUBLIC removes access for both `anon` and `authenticated` that
-- was inherited from the default PUBLIC grant created when each function was
-- written. We then re-GRANT only what is actually needed.

-- ── 3a. Trigger / internal functions — no user-callable grants ────────────────

REVOKE ALL ON FUNCTION public.touch_updated_at()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.update_updated_at_column()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.generate_order_number()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.trg_set_order_number()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.clear_other_default_addresses()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.rls_auto_enable()
  FROM PUBLIC, anon, authenticated;

-- ── 3b. Admin-only RPCs — authenticated only (is_admin() enforced inside) ─────

REVOKE ALL ON FUNCTION public.approve_product(
  uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_product(
  uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean, text
) TO authenticated;

REVOKE ALL ON FUNCTION public.save_product_draft(
  uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_product_draft(
  uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean, text
) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_product(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_product(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.restore_product_to_draft(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_product_to_draft(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_admin_draft_products()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_draft_products() TO authenticated;

REVOKE ALL ON FUNCTION public.get_admin_product_diagnostics()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_product_diagnostics() TO authenticated;

REVOKE ALL ON FUNCTION public.get_global_markup()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_markup() TO authenticated;

REVOKE ALL ON FUNCTION public.get_pricing_analytics()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pricing_analytics() TO authenticated;

REVOKE ALL ON FUNCTION public.get_profit_report(uuid, timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profit_report(uuid, timestamptz, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.get_top_profit_products(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_profit_products(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_bottom_profit_products(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_bottom_profit_products(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.recalculate_all_pricing(numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_pricing(numeric) TO authenticated;

REVOKE ALL ON FUNCTION public.recalculate_product_pricing(uuid, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_product_pricing(uuid, numeric) TO authenticated;

-- ── 3c. User-facing authenticated RPCs ───────────────────────────────────────

-- get_my_profile: only the logged-in user needs this
REVOKE ALL ON FUNCTION public.get_my_profile()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- is_admin: called from RLS policy expressions for authenticated queries
REVOKE ALL ON FUNCTION public.is_admin()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Apple Pay domain verification: only called from authenticated edge function context
REVOKE ALL ON FUNCTION public.get_apple_pay_domain_verification()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_apple_pay_domain_verification() TO authenticated;

-- ── 3d. Payment config RPCs — anon allowed (guest checkout before login) ──────
-- These return only publishable client-side configuration keys, never secrets.

REVOKE ALL ON FUNCTION public.get_worldpay_client_key()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_worldpay_client_key() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_worldpay_wallet_config()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_worldpay_wallet_config() TO anon, authenticated;
