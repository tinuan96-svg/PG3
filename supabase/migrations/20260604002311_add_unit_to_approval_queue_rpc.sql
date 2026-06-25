/*
  # Add unit column to get_admin_approval_queue RPC

  Adds the `unit` field to the approval queue response so variant products
  (e.g. 5kg, 500g, 1L) can be identified directly in the queue without
  opening the edit modal.
*/

DROP FUNCTION IF EXISTS get_admin_approval_queue(text, text, int, int);

CREATE FUNCTION get_admin_approval_queue(
  p_search text  DEFAULT NULL,
  p_filter text  DEFAULT 'all',
  p_limit  int   DEFAULT 25,
  p_offset int   DEFAULT 0
)
RETURNS TABLE (
  id               uuid,
  name             text,
  slug             text,
  sku              text,
  brand            text,
  unit             text,
  image            text,
  price            numeric,
  stock_qty        int,
  approval_status  text,
  visibility_status text,
  category_id      uuid,
  category_name    text,
  has_description  boolean,
  has_seo          boolean,
  has_image        boolean,
  has_category     boolean,
  needs_admin_review boolean,
  synced_at        timestamptz,
  approved_at      timestamptz,
  created_at       timestamptz,
  total_count      bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    COALESCE(p.sku,   '')  AS sku,
    COALESCE(p.brand, '')  AS brand,
    COALESCE(p.unit,  '')  AS unit,
    COALESCE(p.image, '')  AS image,
    COALESCE(p.price, 0)   AS price,
    p.stock_qty,
    p.approval_status,
    p.visibility_status,
    p.category_id,
    COALESCE(c.name, '')   AS category_name,
    (p.description IS NOT NULL AND length(trim(p.description)) > 0)  AS has_description,
    (p.seo_title   IS NOT NULL AND length(trim(p.seo_title))   > 0)  AS has_seo,
    (p.image       IS NOT NULL AND length(trim(p.image))       > 0)  AS has_image,
    (p.category_id IS NOT NULL)                                        AS has_category,
    p.needs_admin_review,
    p.synced_at,
    p.approved_at,
    p.created_at,
    COUNT(*) OVER()                                                     AS total_count
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE
    (
      p_search IS NULL OR p_search = '' OR
      p.name   ILIKE '%' || p_search || '%' OR
      p.sku    ILIKE '%' || p_search || '%' OR
      COALESCE(p.brand, '') ILIKE '%' || p_search || '%'
    )
    AND (
      p_filter IS NULL OR p_filter = '' OR p_filter = 'all'
      OR (p_filter = 'draft'            AND p.approval_status = 'draft')
      OR (p_filter = 'approved'         AND p.approval_status = 'approved')
      OR (p_filter = 'rejected'         AND p.approval_status = 'rejected')
      OR (p_filter = 'missing_category' AND p.category_id IS NULL)
      OR (p_filter = 'missing_image'    AND (p.image IS NULL OR trim(p.image) = ''))
      OR (p_filter = 'missing_seo'      AND (p.seo_title IS NULL OR trim(p.seo_title) = ''))
    )
  ORDER BY
    CASE p.approval_status
      WHEN 'draft'    THEN 0
      WHEN 'rejected' THEN 1
      ELSE 2
    END,
    p.needs_admin_review DESC,
    p.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_approval_queue(text, text, int, int) TO authenticated;
