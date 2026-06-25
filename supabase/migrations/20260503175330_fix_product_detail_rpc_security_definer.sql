/*
  # Fix pocketgrocery_get_store_product_detail RPC

  The function was not SECURITY DEFINER so anonymous callers were
  blocked by RLS on the underlying tables, causing product detail
  pages to return 404.

  This migration recreates the function as SECURITY DEFINER so it
  bypasses RLS (same pattern already used for the list RPC).
*/

CREATE OR REPLACE FUNCTION public.pocketgrocery_get_store_product_detail(
  p_store_slug text,
  p_product_slug text
)
RETURNS TABLE(
  product_id uuid,
  slug text,
  name text,
  description text,
  image_url text,
  gallery_images text[],
  price numeric,
  original_price numeric,
  discount_percentage numeric,
  stock integer,
  in_stock boolean,
  has_variants boolean,
  category_id uuid,
  main_category_id uuid,
  is_bestseller boolean,
  is_deal boolean,
  is_new_arrival boolean,
  is_trending boolean,
  sales_last_30_days integer,
  velocity_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
with store_cte as (
  select s.id
  from public.stores s
  where s.slug = p_store_slug
  limit 1
),
latest_metrics as (
  select distinct on (pm.product_id)
    pm.product_id,
    pm.sales_last_30_days,
    pm.velocity_score
  from public.product_metrics pm
  join store_cte st
    on st.id = pm.store_id
  order by pm.product_id, pm.metrics_date desc
)
select
  p.id as product_id,
  p.slug,
  coalesce(sp.name_override, p.name) as name,
  coalesce(sp.description_override, p.description) as description,
  coalesce(
    case when sp.image_cdn_url like 'https://%' then sp.image_cdn_url end,
    case when sp.image_override like 'https://%' then sp.image_override end,
    p.image_main,
    p.image_medium,
    case
      when p.image_url like 'https://%' then p.image_url
      when p.image_url is not null and p.image_url not like '/products/%'
      then 'https://icnvrpnzjjcbvgcqgiua.supabase.co/storage/v1/object/public/product-images' || p.image_url
    end,
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
where p.slug = p_product_slug
limit 1;
$$;

GRANT EXECUTE ON FUNCTION public.pocketgrocery_get_store_product_detail(text, text) TO anon, authenticated;
