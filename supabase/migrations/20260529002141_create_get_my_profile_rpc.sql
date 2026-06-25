/*
  # Create get_my_profile RPC

  A SECURITY DEFINER function that returns the current user's profile row,
  bypassing RLS timing issues that can occur right after sign-in when the
  JWT hasn't propagated to the RLS context yet.
*/

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id uuid,
  auth_user_id uuid,
  full_name text,
  email text,
  phone text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    auth_user_id,
    full_name,
    email,
    phone,
    role,
    created_at
  FROM user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
