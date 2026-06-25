/*
  # Fix approve_product: resolve approved_by via user_profiles

  ## Problem
  The `products.approved_by` column has a FK to `user_profiles(id)`.
  `user_profiles.id` is a generated UUID, NOT the same as `auth.users.id`.
  The function was setting `approved_by = auth.uid()` which is the auth UID,
  causing a FK violation because that value doesn't exist in `user_profiles(id)`.

  ## Fix
  Look up the matching `user_profiles.id` using `auth_user_id = auth.uid()` and
  use that value for `approved_by`. If no profile row is found, set it to NULL
  (ON DELETE SET NULL is already configured on the FK).
*/

CREATE OR REPLACE FUNCTION public.approve_product(
  p_id                uuid,
  p_name              text    DEFAULT NULL,
  p_short_description text    DEFAULT NULL,
  p_description       text    DEFAULT NULL,
  p_category_id       uuid    DEFAULT NULL,
  p_image             text    DEFAULT NULL,
  p_price             numeric DEFAULT NULL,
  p_compare_price     numeric DEFAULT NULL,
  p_seo_title         text    DEFAULT NULL,
  p_seo_description   text    DEFAULT NULL,
  p_seo_keywords      text    DEFAULT NULL,
  p_featured          boolean DEFAULT NULL,
  p_brand             text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Resolve the user_profiles.id for the current auth user
  SELECT id INTO v_profile_id
  FROM user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  UPDATE products SET
    name               = COALESCE(p_name,              name),
    short_description  = COALESCE(p_short_description, short_description),
    description        = COALESCE(p_description,       description),
    category_id        = COALESCE(p_category_id,       category_id),
    image              = COALESCE(p_image,              image),
    price              = COALESCE(p_price,              price),
    compare_price      = COALESCE(p_compare_price,      compare_price),
    seo_title          = COALESCE(p_seo_title,          seo_title),
    seo_description    = COALESCE(p_seo_description,    seo_description),
    seo_keywords       = COALESCE(p_seo_keywords,       seo_keywords),
    featured           = COALESCE(p_featured,           featured),
    brand              = COALESCE(p_brand,              brand),
    approval_status    = 'approved',
    visibility_status  = 'visible',
    needs_admin_review = false,
    approved_at        = now(),
    approved_by        = v_profile_id,
    updated_at         = now()
  WHERE id = p_id;
END;
$$;
