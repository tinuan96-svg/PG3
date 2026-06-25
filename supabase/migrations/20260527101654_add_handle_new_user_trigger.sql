/*
  # Auto-create user_profiles on signup

  ## Problem
  When a user signs up via Supabase Auth, no row is created in `user_profiles`.
  This means profiles never appear in the admin panel and auth guards break.

  ## Changes
  1. Creates `handle_new_user()` function in the `public` schema
     - Reads `full_name` / `name` from auth metadata if present
     - Reads email from `auth.users`
     - Inserts a row into `user_profiles` with role = 'customer'
     - Uses `ON CONFLICT DO NOTHING` so re-runs are safe

  2. Creates `on_auth_user_created` trigger on `auth.users`
     - Fires AFTER INSERT for every new signup

  3. Backfills existing auth users that have no profile row yet
*/

-- ─── Trigger function ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_user_id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    'customer'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ─── Trigger on auth.users ───────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Unique constraint needed for ON CONFLICT ────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_auth_user_id_key'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

-- ─── Backfill: create profiles for any existing auth users missing one ───────

INSERT INTO public.user_profiles (auth_user_id, email, full_name, role)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(COALESCE(u.email, ''), '@', 1)
  ),
  'customer'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.auth_user_id = u.id
)
ON CONFLICT (auth_user_id) DO NOTHING;
