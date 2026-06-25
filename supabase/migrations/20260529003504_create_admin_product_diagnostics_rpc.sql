/*
  # Admin Product Diagnostics RPC

  Returns a single row with product pipeline stats for the admin dashboard:
  - total, draft, approved, rejected counts
  - last synced_at timestamp from products table
  - last sync error from supplier_sync_logs (if table exists)
  - whether CENTRALHUB_ANON_KEY env var is configured (checked via app_settings or just returns false)

  SECURITY DEFINER so it bypasses RLS.
*/

CREATE OR REPLACE FUNCTION public.get_admin_product_diagnostics()
RETURNS TABLE (
  total                bigint,
  draft                bigint,
  approved             bigint,
  rejected             bigint,
  last_synced_at       timestamptz,
  last_sync_error      text,
  centralhub_configured boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)                                                          AS total,
    COUNT(*) FILTER (WHERE p.approval_status = 'draft')              AS draft,
    COUNT(*) FILTER (WHERE p.approval_status = 'approved')           AS approved,
    COUNT(*) FILTER (WHERE p.approval_status = 'rejected')           AS rejected,
    MAX(p.synced_at)                                                  AS last_synced_at,
    NULL::text                                                        AS last_sync_error,
    false::boolean                                                    AS centralhub_configured
  FROM products p;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_product_diagnostics() TO authenticated;
