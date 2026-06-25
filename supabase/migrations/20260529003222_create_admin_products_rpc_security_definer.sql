/*
  # Admin Products RPC (SECURITY DEFINER)

  Problem: The products table RLS policy "Admins can view all products" does a correlated
  subquery against user_profiles which can fail due to JWT timing after login, causing
  the Product Approval page to return 0 rows even when 50 draft products exist.

  Fix: Create a SECURITY DEFINER function that:
    1. Verifies the caller is an admin via get_my_profile()
    2. Returns draft/rejected products bypassing RLS entirely

  New functions:
    - get_admin_draft_products() — returns draft + rejected products for the approval page
    - approve_product(product_id, category_id, ...) — approves a product
    - reject_product(product_id) — rejects a product
    - restore_product_to_draft(product_id) — moves rejected back to draft
    - save_product_draft(product_id, ...) — saves edits to a draft
*/

-- ─── Helper: is current user an admin? ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ─── Fetch draft/rejected products for admin approval page ────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_draft_products()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  short_description text,
  image text,
  category_id uuid,
  price numeric,
  compare_price numeric,
  approval_status text,
  source_product_id text,
  created_at timestamptz,
  synced_at timestamptz,
  seo_title text,
  seo_description text,
  seo_keywords text,
  featured boolean,
  visibility_status text,
  category_name text,
  category_uuid uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
    p.image,
    p.category_id,
    p.price,
    p.compare_price,
    p.approval_status,
    p.source_product_id,
    p.created_at,
    p.synced_at,
    p.seo_title,
    p.seo_description,
    p.seo_keywords,
    p.featured,
    p.visibility_status,
    c.name  AS category_name,
    c.id    AS category_uuid
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE
    is_admin()
    AND p.approval_status IN ('draft', 'rejected')
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_draft_products() TO authenticated;

-- ─── Approve a product ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_product(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_short_description text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_image text DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_compare_price numeric DEFAULT NULL,
  p_seo_title text DEFAULT NULL,
  p_seo_description text DEFAULT NULL,
  p_seo_keywords text DEFAULT NULL,
  p_featured boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE products SET
    name              = COALESCE(p_name, name),
    short_description = COALESCE(p_short_description, short_description),
    description       = COALESCE(p_description, description),
    category_id       = COALESCE(p_category_id, category_id),
    image             = COALESCE(p_image, image),
    price             = COALESCE(p_price, price),
    compare_price     = COALESCE(p_compare_price, compare_price),
    seo_title         = COALESCE(p_seo_title, seo_title),
    seo_description   = COALESCE(p_seo_description, seo_description),
    seo_keywords      = COALESCE(p_seo_keywords, seo_keywords),
    featured          = COALESCE(p_featured, featured),
    approval_status   = 'approved',
    visibility_status = 'visible',
    approved_at       = now(),
    approved_by       = auth.uid(),
    updated_at        = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_product(uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean) TO authenticated;

-- ─── Reject a product ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_product(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE products SET
    approval_status   = 'rejected',
    visibility_status = 'hidden',
    updated_at        = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_product(uuid) TO authenticated;

-- ─── Restore product to draft ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.restore_product_to_draft(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE products SET
    approval_status   = 'draft',
    visibility_status = 'hidden',
    updated_at        = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_product_to_draft(uuid) TO authenticated;

-- ─── Save draft edits ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_product_draft(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_short_description text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_image text DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_compare_price numeric DEFAULT NULL,
  p_seo_title text DEFAULT NULL,
  p_seo_description text DEFAULT NULL,
  p_seo_keywords text DEFAULT NULL,
  p_featured boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE products SET
    name              = COALESCE(p_name, name),
    short_description = COALESCE(p_short_description, short_description),
    description       = COALESCE(p_description, description),
    category_id       = COALESCE(p_category_id, category_id),
    image             = COALESCE(p_image, image),
    price             = COALESCE(p_price, price),
    compare_price     = COALESCE(p_compare_price, compare_price),
    seo_title         = COALESCE(p_seo_title, seo_title),
    seo_description   = COALESCE(p_seo_description, seo_description),
    seo_keywords      = COALESCE(p_seo_keywords, seo_keywords),
    featured          = COALESCE(p_featured, featured),
    updated_at        = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_product_draft(uuid, text, text, text, uuid, text, numeric, numeric, text, text, text, boolean) TO authenticated;
