/*
  # Add brand filter to pocketgrocery_get_store_products RPC

  ## Changes
  - Adds `p_brand_slug` (text, default NULL) parameter to the main store products RPC
  - Filters products by joining to the `brands` table when p_brand_slug is provided
  - Adds `allow_backorder` to the return type (was missing, frontend expects it)

  ## Notes
  - Uses DROP/CREATE to replace the function signature (new parameter added)
  - Brand join is a LEFT JOIN filtered in WHERE, so non-brand queries are unaffected
*/

DROP FUNCTION IF EXISTS public.pocketgrocery_get_store_products(
  text, uuid, uuid, boolean, text, text, integer, integer
);

CREATE OR REPLACE FUNCTION public.pocketgrocery_get_store_products(
  p_store_slug        text,
  p_category_id       uuid    DEFAULT NULL,
  p_main_category_id  uuid    DEFAULT NULL,
  p_in_stock_only     boolean DEFAULT false,
  p_search            text    DEFAULT NULL,
  p_sort              text    DEFAULT 'default',
  p_limit             integer DEFAULT 40,
  p_offset            integer DEFAULT 0,
  p_brand_slug        text    DEFAULT NULL,
  p_brand_name        text    DEFAULT NULL
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
  allow_backorder     boolean,
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
      p.image_main, p.image_url,
      resolve_product_image(sp.image_cdn_url),
      resolve_product_image(sp.image_override),
      p.image_medium, p.image_thumbnail
    ) AS image_url,
    COALESCE(sp.gallery_images_override, p.gallery_images) AS gallery_images,
    COALESCE(
      NULLIF(sp.price_override, 0),
      NULLIF(p.price, 0),
      (SELECT MIN(pv.price) FROM public.product_variants pv WHERE pv.product_id = p.id AND pv.is_active = true)
    ) AS price,
    COALESCE(
      NULLIF(p.original_price, 0),
      (SELECT MAX(pv.price) FROM public.product_variants pv WHERE pv.product_id = p.id AND pv.is_active = true)
    ) AS original_price,
    p.discount_percentage,
    COALESCE(sp.current_stock, p.stock) AS stock,
    (COALESCE(sp.current_stock, p.stock, 0) > 0) AS in_stock,
    COALESCE(p.allow_backorder, false) AS allow_backorder,
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
  LEFT JOIN public.brands b ON b.id = p.brand_id
  LEFT JOIN public.product_marketing_tags pmt ON pmt.store_id = st.id AND pmt.product_id = p.id
  LEFT JOIN latest_metrics lm ON lm.product_id = p.id
  WHERE
    (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_main_category_id IS NULL OR p.main_category_id = p_main_category_id)
    AND (p_in_stock_only = false OR COALESCE(sp.current_stock, p.stock, 0) > 0)
    AND (p_search IS NULL OR p_search = ''
         OR COALESCE(sp.name_override, p.name) ILIKE '%' || p_search || '%'
         OR COALESCE(sp.description_override, p.description) ILIKE '%' || p_search || '%')
    AND (p_brand_slug IS NULL OR b.slug = p_brand_slug)
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

GRANT EXECUTE ON FUNCTION public.pocketgrocery_get_store_products(
  text, uuid, uuid, boolean, text, text, integer, integer, text, text
) TO anon, authenticated;
