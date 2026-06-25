/*
  # Fix media_library RLS policies — use auth_user_id not id

  ## Problem
  The media_library RLS policies used `user_profiles.id = auth.uid()` but
  user_profiles.id is an internal PK (uuid), NOT the auth user id.
  The correct column is `user_profiles.auth_user_id` which stores the
  Supabase auth.users FK. This mismatch silently blocked all SELECT, INSERT,
  and DELETE operations, causing uploads to fail and the library to show empty.

  ## Changes
  - Drop all three existing media_library policies
  - Recreate them with the correct `auth_user_id = auth.uid()` check
*/

DROP POLICY IF EXISTS "Admins can view all media" ON media_library;
DROP POLICY IF EXISTS "Admins can insert media" ON media_library;
DROP POLICY IF EXISTS "Admins can delete media" ON media_library;

CREATE POLICY "Admins can view all media"
  ON media_library FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert media"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete media"
  ON media_library FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );
