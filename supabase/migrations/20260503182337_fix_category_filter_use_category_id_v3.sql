/*
  # Fix category filtering — use products.category_id (v3)

  Drops old signature and recreates pocketgrocery_get_store_products
  with correct return type (gallery_images text[]) and new p_category_id param.
  Also recreates get_store_categories with category_id output.
*/

DROP FUNCTION IF EXISTS public.get_store_categories(text);

CREATE FUNCTION public.get_store_categories(p_store_slug text)
RETURNS TABLE(
  store_slug           text,
  store_category_id    uuid,
  store_category_name  text,
  store_category_slug  text,
  main_category_id     uuid,
  main_category_name   text,
  category_id          uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    s.slug,
    sc.id,
    sc.name,
    COALESCE(sc.slug, LOWER(REGEXP_REPLACE(sc.name, '[^a-zA-Z0-9]+', '-', 'g'))),
    mc.id,
    mc.name,
    cat.id
  FROM public.stores s
  JOIN public.store_category_mappings scm ON scm.store_id = s.id
  JOIN public.store_categories sc         ON sc.id = scm.store_category_id
  LEFT JOIN public.main_categories mc     ON mc.id = scm.main_category_id
  LEFT JOIN public.categories cat         ON LOWER(cat.name) = LOWER(sc.name)
  WHERE s.slug = p_store_slug AND s.visibility = true AND sc.is_active = true
  ORDER BY sc.sort_order ASC NULLS LAST, sc.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_categories(text) TO anon, authenticated;

-- Drop old signature (no p_category_id)
DROP FUNCTION IF EXISTS public.pocketgrocery_get_store_products(text,text,uuid,numeric,numeric,boolean,text,integer,integer);

CREATE FUNCTION public.pocketgrocery_get_store_products(
  p_store_slug        text,
  p_search            text    DEFAULT NULL,
  p_main_category_id  uuid    DEFAULT NULL,
  p_category_id       uuid    DEFAULT NULL,
  p_min_price         numeric DEFAULT NULL,
  p_max_price         numeric DEFAULT NULL,
  p_in_stock_only     boolean DEFAULT false,
  p_sort              text    DEFAULT 'popular',
  p_limit             integer DEFAULT 20,
  p_offset            integer DEFAULT 0
)
RETURNS TABLE(
  product_id          uuid,
  slug                text,
  name                text,
  description         text,
  image_url           text,
  gallery_images      text[],
  price               numeric,
  original_price      numeric,
  discount_percentage numeric,
  stock               integer,
  in_stock            boolean,
  has_variants        boolean,
  category_id         uuid,
  main_category_id    uuid,
  is_bestseller       boolean,
  is_deal             boolean,
  is_new_arrival      boolean,
  is_trending         boolean,
  sales_last_30_days  integer,
  velocity_score      numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH store_cte AS (
  SELECT id FROM public.stores WHERE slug = p_store_slug LIMIT 1
),
latest_metrics AS (
  SELECT DISTINCT ON (pm.product_id)
    pm.product_id, pm.sales_last_30_days, pm.velocity_score
  FROM public.product_metrics pm
  JOIN store_cte st ON st.id = pm.store_id
  ORDER BY pm.product_id, pm.metrics_date DESC
),
base AS (
  SELECT
    p.id AS product_id,
    p.slug,
    COALESCE(sp.name_override, p.name) AS name,
    COALESCE(sp.description_override, p.description) AS description,
    COALESCE(
      CASE WHEN sp.image_cdn_url LIKE 'https://%' THEN sp.image_cdn_url END,
      CASE WHEN sp.image_override LIKE 'https://%' THEN sp.image_override END,
      p.image_main,
      p.image_medium,
      CASE
        WHEN p.image_url LIKE 'https://%' THEN p.image_url
        WHEN p.image_url IS NOT NULL AND p.image_url NOT LIKE '/products/%'
        THEN 'https://icnvrpnzjjcbvgcqgiua.supabase.co/storage/v1/object/public/product-images' || p.image_url
      END,
      p.image_thumbnail
    ) AS image_url,
    COALESCE(sp.gallery_images_override, p.gallery_images) AS gallery_images,
    COALESCE(sp.price_override, p.price) AS price,
    p.original_price,
    p.discount_percentage,
    COALESCE(sp.stock_override, p.stock) AS stock,
    (COALESCE(sp.stock_override, p.stock) > 0) AS in_stock,
    p.has_variants,
    p.category_id,
    p.main_category_id,
    COALESCE(pmt.is_best_seller, p.is_bestseller, false) AS is_bestseller,
    COALESCE(pmt.is_deal, p.is_deal, false) AS is_deal,
    COALESCE(pmt.is_new_arrival, p.is_new_arrival, false) AS is_new_arrival,
    COALESCE(pmt.is_trending, p.is_hot_product, false) AS is_trending,
    lm.sales_last_30_days,
    lm.velocity_score
  FROM store_cte st
  JOIN public.store_products sp ON sp.store_id = st.id AND sp.is_active = true
  JOIN public.products p ON p.id = sp.product_id AND p.is_active = true
  LEFT JOIN public.product_marketing_tags pmt ON pmt.store_id = st.id AND pmt.product_id = p.id
  LEFT JOIN latest_metrics lm ON lm.product_id = p.id
  WHERE
    (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_main_category_id IS NULL OR p.main_category_id = p_main_category_id)
    AND (p_min_price IS NULL OR COALESCE(sp.price_override, p.price) >= p_min_price)
    AND (p_max_price IS NULL OR COALESCE(sp.price_override, p.price) <= p_max_price)
    AND (NOT p_in_stock_only OR COALESCE(sp.stock_override, p.stock) > 0)
    AND (
      p_search IS NULL OR p_search = ''
      OR COALESCE(sp.name_override, p.name) ILIKE '%' || p_search || '%'
      OR COALESCE(sp.description_override, p.description) ILIKE '%' || p_search || '%'
    )
)
SELECT * FROM base
ORDER BY
  CASE WHEN p_sort = 'price_asc'  THEN price END ASC  NULLS LAST,
  CASE WHEN p_sort = 'price_desc' THEN price END DESC NULLS LAST,
  CASE WHEN p_sort = 'newest'     THEN product_id::text END DESC,
  CASE WHEN p_sort = 'popular'    THEN COALESCE(velocity_score, 0) END DESC,
  CASE WHEN p_sort = 'popular'    THEN COALESCE(sales_last_30_days, 0) END DESC,
  product_id DESC
LIMIT  GREATEST(p_limit, 1)
OFFSET GREATEST(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION public.pocketgrocery_get_store_products(text,text,uuid,uuid,numeric,numeric,boolean,text,integer,integer) TO anon, authenticated;
