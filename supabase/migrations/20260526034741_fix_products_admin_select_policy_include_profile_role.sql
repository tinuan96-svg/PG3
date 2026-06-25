/*
  # Fix admin SELECT policy on products to also check user_profiles.profile_role

  The existing "Admin full product view" policy only checks app_metadata JWT claims,
  but admin users are identified via user_profiles.profile_role = 'admin'.
  This fix replaces the policy to also accept profile_role = 'admin'.
*/

DROP POLICY IF EXISTS "Admin full product view" ON products;

CREATE POLICY "Admin full product view"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean) = true)
    OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.profile_role = 'admin'
    )
  );
