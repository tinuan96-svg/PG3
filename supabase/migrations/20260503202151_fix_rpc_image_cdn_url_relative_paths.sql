/*
  # Fix image resolution in product detail and store products RPCs

  Both RPCs only used image_cdn_url/image_override when they started with 'https://'.
  All 308 store products have relative paths like '/products/filename.webp' in image_cdn_url,
  which caused them to fall through to the external image_url (malluspices.com) that doesn't load.

  Fix: resolve relative image_cdn_url and image_override paths using the Supabase storage base URL,
  giving them priority over external image_url values.
*/

-- Fix pocketgrocery_get_store_product_detail
DROP FUNCTION IF EXISTS pocketgrocery_get_store_product_detail(text, text);

CREATE OR REPLACE FUNCTION pocketgrocery_get_store_product_detail(
  p_store_slug text,
  p_product_slug text
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
  join store_cte st on st.id = pm.store_id
  order by pm.product_id, pm.metrics_date desc
),
product_row as (
  select
    p.id as product_id,
    p.slug,
    coalesce(sp.name_override, p.name) as name,
    coalesce(sp.description_override, p.description) as description,
    -- Resolve image: prefer image_cdn_url, then image_override, then product images
    -- Relative paths get the Supabase storage prefix
    case
      when sp.image_cdn_url is not null then
        case when sp.image_cdn_url like 'https://%' then sp.image_cdn_url
             else 'https://icnvrpnzjjcbvgcqgiua.supabase.co/storage/v1/object/public/product-images' || sp.image_cdn_url
        end
      when sp.image_override is not null then
        case when sp.image_override like 'https://%' then sp.image_override
             else 'https://icnvrpnzjjcbvgcqgiua.supabase.co/storage/v1/object/public/product-images' || sp.image_override
        end
      when p.image_main is not null then p.image_main
      when p.image_medium is not null then p.image_medium
      when p.image_url is not null then
        case when p.image_url like 'https://%' then p.image_url
             else 'https://icnvrpnzjjcbvgcqgiua.supabase.co/storage/v1/object/public/product-images' || p.image_url
        end
      else p.image_thumbnail
    end as image_url,
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
  limit 1
),
variants_agg as (
  select
    pr.product_id,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id',               pv.id,
          'variant_name',     pv.variant_name,
          'price',            pv.price,
          'discounted_price', pv.discounted_price,
          'stock',            pv.stock,
          'unit_value',       pv.unit_value,
          'unit_type',        pv.unit_type,
          'sort_order',       pv.sort_order,
          'image_url',        case
                                when pv.image_url like 'https://%' then pv.image_url
                                when pv.image_url is not null
                                  then 'https://icnvrpnzjjcbvgcqgiua.supabase.co/storage/v1/object/public/product-images' || pv.image_url
                                else null
                              end
        )
        order by coalesce(pv.sort_order, 999), pv.variant_name
      ),
      '[]'::jsonb
    ) as variants
  from product_row pr
  join public.product_variants pv
    on pv.product_id = pr.product_id
   and pv.is_active = true
  group by pr.product_id
)
select jsonb_build_object(
  'product_id',          pr.product_id,
  'slug',                pr.slug,
  'name',                pr.name,
  'description',         pr.description,
  'image_url',           pr.image_url,
  'gallery_images',      pr.gallery_images,
  'price',               pr.price,
  'original_price',      pr.original_price,
  'discount_percentage', pr.discount_percentage,
  'stock',               pr.stock,
  'in_stock',            pr.in_stock,
  'has_variants',        pr.has_variants,
  'category_id',         pr.category_id,
  'main_category_id',    pr.main_category_id,
  'is_bestseller',       pr.is_bestseller,
  'is_deal',             pr.is_deal,
  'is_new_arrival',      pr.is_new_arrival,
  'is_trending',         pr.is_trending,
  'sales_last_30_days',  pr.sales_last_30_days,
  'velocity_score',      pr.velocity_score,
  'variants',            coalesce(va.variants, '[]'::jsonb)
)
from product_row pr
left join variants_agg va on va.product_id = pr.product_id;
$$;
