/*
  # Fix image URL resolution in store products RPC

  ## Problem
  image_cdn_url and image_override contain legacy relative paths like
  /products/foo.jpg from a previous WooCommerce site. Files don't exist
  in Supabase storage. The COALESCE picked these first, returning broken
  image URLs. Only image_main/image_medium/image_thumbnail have real URLs.

  ## Fix
  Recreate the RPC skipping override fields unless they start with https://.
  Also corrects gallery_images return type to text[] (was wrongly declared jsonb).
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
        CASE WHEN sp.image_cdn_url LIKE 'https://%' THEN sp.image_cdn_url END,
        CASE WHEN sp.image_override  LIKE 'https://%' THEN sp.image_override  END,
        p.image_main,
        p.image_medium,
        p.image_url,
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
