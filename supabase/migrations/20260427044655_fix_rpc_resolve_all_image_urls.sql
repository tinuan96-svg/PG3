/*
  # Fix RPC to resolve all relative image URLs to full Supabase storage URLs

  ## Problem
  Products have images stored in two ways:
  1. p.image_main / image_medium / image_thumbnail — already full https:// URLs (product-images-clean bucket)
  2. p.image_url — relative path like /20260205_032054.jpg (product-images bucket, root level)
  3. sp.image_cdn_url / image_override — legacy /products/foo.jpg paths (files don't exist)

  The RPC was returning null for most products because relative paths weren't converted.

  ## Fix
  In the COALESCE, convert p.image_url relative paths to full URLs using the
  product-images bucket. Skip sp.image_cdn_url/image_override unless they are
  already full https:// URLs (legacy WooCommerce paths, files don't exist).
*/

DROP FUNCTION IF EXISTS pocketgrocery_get_store_products(text,text,uuid,numeric,numeric,boolean,text,integer,integer);

CREATE FUNCTION pocketgrocery_get_store_products(
  p_store_slug        text,
  p_search            text    DEFAULT NULL,
  p_main_category_id  uuid    DEFAULT NULL,
  p_min_price         numeric DEFAULT NULL,
  p_max_price         numeric DEFAULT NULL,
  p_in_stock_only     boolean DEFAULT false,
  p_sort              text    DEFAULT 'popular',
  p_limit             integer DEFAULT 20,
  p_offset            integer DEFAULT 0
)
RETURNS TABLE (
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
AS $$
  with store_cte as (
    select id
    from public.stores
    where slug = p_store_slug
    limit 1
  ),
  latest_metrics as (
    select distinct on (pm.product_id)
      pm.product_id,
      pm.sales_last_30_days,
      pm.velocity_score
    from public.product_metrics pm
    join store_cte st on st.id = pm.store_id
    order by pm.product_id, pm.metrics_date desc
  ),
  base as (
    select
      p.id as product_id,
      p.slug,
      coalesce(sp.name_override, p.name) as name,
      coalesce(sp.description_override, p.description) as description,
      coalesce(
        -- use override/cdn only if they are already full https URLs
        CASE WHEN sp.image_cdn_url LIKE 'https://%' THEN sp.image_cdn_url END,
        CASE WHEN sp.image_override  LIKE 'https://%' THEN sp.image_override  END,
        -- clean processed images (already full URLs)
        p.image_main,
        p.image_medium,
        -- raw uploaded images: convert relative /filename.jpg to full storage URL
        CASE
          WHEN p.image_url LIKE 'https://%' THEN p.image_url
          WHEN p.image_url IS NOT NULL AND p.image_url NOT LIKE '/products/%'
          THEN 'https://icnvrpnzjjcbvgcqgiua.supabase.co/storage/v1/object/public/product-images'
               || p.image_url
        END,
        p.image_thumbnail
      ) as image_url,
      coalesce(sp.gallery_images_override, p.gallery_images) as gallery_images,
      coalesce(sp.price_override, p.price) as price,
      p.original_price,
      p.discount_percentage,
      coalesce(sp.stock_override, p.stock) as stock,
      (coalesce(sp.stock_override, p.stock) > 0) as in_stock,
      p.has_variants,
      p.category_id,
      p.main_category_id,
      coalesce(pmt.is_best_seller, p.is_bestseller, false) as is_bestseller,
      coalesce(pmt.is_deal, p.is_deal, false) as is_deal,
      coalesce(pmt.is_new_arrival, p.is_new_arrival, false) as is_new_arrival,
      coalesce(pmt.is_trending, p.is_hot_product, false) as is_trending,
      lm.sales_last_30_days,
      lm.velocity_score
    from store_cte st
    join public.store_products sp
      on sp.store_id = st.id
     and sp.is_active = true
    join public.products p
      on p.id = sp.product_id
     and p.is_active = true
    left join public.product_marketing_tags pmt
      on pmt.store_id = st.id
     and pmt.product_id = p.id
    left join latest_metrics lm
      on lm.product_id = p.id
    where
      (p_main_category_id is null or p.main_category_id = p_main_category_id)
      and (p_min_price is null or coalesce(sp.price_override, p.price) >= p_min_price)
      and (p_max_price is null or coalesce(sp.price_override, p.price) <= p_max_price)
      and (not p_in_stock_only or coalesce(sp.stock_override, p.stock) > 0)
      and (
        p_search is null
        or p_search = ''
        or coalesce(sp.name_override, p.name) ilike '%' || p_search || '%'
        or coalesce(sp.description_override, p.description) ilike '%' || p_search || '%'
      )
  )
  select *
  from base
  order by
    case when p_sort = 'price_asc' then price end asc nulls last,
    case when p_sort = 'price_desc' then price end desc nulls last,
    case when p_sort = 'newest' then product_id::text end desc,
    case when p_sort = 'popular' then coalesce(velocity_score, 0) end desc,
    case when p_sort = 'popular' then coalesce(sales_last_30_days, 0) end desc,
    product_id desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION pocketgrocery_get_store_products TO anon, authenticated;
