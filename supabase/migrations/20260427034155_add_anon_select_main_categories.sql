/*
  # Add anon SELECT policy on main_categories

  The store page RPC categories CTE joins main_categories but the existing
  SELECT policy only covers authenticated users, so categories returned
  zero rows for public (anon) visitors.
*/

CREATE POLICY "Anon can view main categories"
  ON main_categories
  FOR SELECT
  TO anon
  USING (COALESCE(is_active, true) = true);
