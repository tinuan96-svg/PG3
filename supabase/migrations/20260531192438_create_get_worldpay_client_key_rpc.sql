/*
  # Public RPC: get_worldpay_client_key

  Returns only the public Worldpay client key (safe to expose to browsers).
  Runs SECURITY DEFINER so anon/authenticated users can fetch it without
  needing direct access to worldpay_settings (which is admin-only).
*/

CREATE OR REPLACE FUNCTION get_worldpay_client_key()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_key
  FROM worldpay_settings
  WHERE id = '00000000-0000-0000-0000-000000000099'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_worldpay_client_key() TO anon, authenticated;
