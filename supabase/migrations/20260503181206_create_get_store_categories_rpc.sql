/*
  # Create get_store_categories RPC

  Returns active categories for a given store slug, joining
  store_category_mappings -> store_categories -> main_categories.

  Output fields:
  - store_slug
  - store_category_id
  - store_category_name
  - store_category_slug (fallback: slugified name)
  - main_category_id
  - main_category_name

  Security: SECURITY DEFINER so anon callers bypass RLS on the underlying tables.
*/

CREATE OR REPLACE FUNCTION public.get_store_categories(p_store_slug text)
RETURNS TABLE(
  store_slug        text,
  store_category_id uuid,
  store_category_name text,
  store_category_slug text,
  main_category_id  uuid,
  main_category_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    s.slug AS store_slug,
    sc.id  AS store_category_id,
    sc.name AS store_category_name,
    COALESCE(
      sc.slug,
      LOWER(REGEXP_REPLACE(sc.name, '[^a-zA-Z0-9]+', '-', 'g'))
    ) AS store_category_slug,
    mc.id   AS main_category_id,
    mc.name AS main_category_name
  FROM public.stores s
  JOIN public.store_category_mappings scm ON scm.store_id = s.id
  JOIN public.store_categories sc         ON sc.id = scm.store_category_id
  LEFT JOIN public.main_categories mc     ON mc.id = scm.main_category_id
  WHERE s.slug       = p_store_slug
    AND s.visibility = true
    AND sc.is_active = true
  ORDER BY sc.sort_order ASC NULLS LAST, sc.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_categories(text) TO anon, authenticated;
