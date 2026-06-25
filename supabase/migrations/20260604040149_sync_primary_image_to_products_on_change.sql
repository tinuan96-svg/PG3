/*
  # Sync Primary Product Image to products.image

  ## Summary
  Ensures the product gallery managed in `product_images` stays in sync with
  `products.image` (the main storefront image field). Without this, images added
  through the admin Images tab are stored in `product_images` but never reflected
  on the storefront product page which reads `products.image`.

  ## Changes

  ### New Function: sync_primary_product_image(product_id)
  - Reads the primary (is_primary = true) row from product_images for the given product
  - Prefers processed_url over url (white-background version)
  - Updates products.image to that URL
  - Falls back to the lowest sort_order image if no is_primary row exists

  ### Updated Function: approve_product(p_id)
  - After setting approval_status = 'approved', calls sync_primary_product_image
  - Ensures the storefront image is always populated at approval time

  ### New Trigger: product_images_sync_trigger
  - Fires AFTER INSERT, UPDATE, DELETE on product_images
  - Automatically keeps products.image in sync whenever images are added/changed/removed
  - Only runs when is_primary changes or a row is deleted
*/

-- ── Helper: sync primary image from product_images → products.image ─────────

CREATE OR REPLACE FUNCTION sync_primary_product_image(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
BEGIN
  -- Try primary image first (prefer processed_url)
  SELECT COALESCE(processed_url, url)
  INTO v_url
  FROM product_images
  WHERE product_id = p_product_id
    AND is_primary = true
  LIMIT 1;

  -- Fall back to lowest sort_order image
  IF v_url IS NULL THEN
    SELECT COALESCE(processed_url, url)
    INTO v_url
    FROM product_images
    WHERE product_id = p_product_id
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;
  END IF;

  IF v_url IS NOT NULL THEN
    UPDATE products SET image = v_url, updated_at = now()
    WHERE id = p_product_id AND (image IS DISTINCT FROM v_url);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION sync_primary_product_image(uuid) TO authenticated;


-- ── Trigger function ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION product_images_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  PERFORM sync_primary_product_image(v_product_id);
  RETURN NULL;
END;
$$;


-- ── Attach trigger ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS product_images_sync_trigger ON product_images;

CREATE TRIGGER product_images_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON product_images
FOR EACH ROW
EXECUTE FUNCTION product_images_after_change();


-- ── Update approve_product to sync image at approval time ─────────────────────

DROP FUNCTION IF EXISTS approve_product(uuid);

CREATE FUNCTION approve_product(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approver_profile_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Resolve the user_profiles.id that matches the current auth user
  SELECT id INTO v_approver_profile_id
  FROM user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  -- Sync primary image before approving so products.image is populated
  PERFORM sync_primary_product_image(p_id);

  UPDATE products SET
    approval_status    = 'approved',
    visibility_status  = 'visible',
    needs_admin_review = false,
    approved_by        = v_approver_profile_id,
    approved_at        = now(),
    updated_at         = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_product(uuid) TO authenticated;


-- ── Run a one-time backfill for any products with product_images but empty image ──

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT pi.product_id
    FROM product_images pi
    JOIN products p ON p.id = pi.product_id
    WHERE (p.image IS NULL OR trim(p.image) = '')
  LOOP
    PERFORM sync_primary_product_image(r.product_id);
  END LOOP;
END;
$$;
