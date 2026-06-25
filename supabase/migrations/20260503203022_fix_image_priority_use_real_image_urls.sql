/*
  # Fix image priority — use real image URLs, not fake CDN paths

  The image_cdn_url and image_override columns contain generated slugified paths
  like '/products/brand-product-name.webp' that do NOT exist in storage.
  The real images are in image_url and image_main (either malluspices.com or
  actual Supabase storage with timestamp-based filenames).

  Correct priority:
    1. image_url / image_main (real uploaded images)
    2. image_cdn_url / image_override only if they start with 'https://'
       (i.e. a real absolute URL, not a generated relative path)
    3. image_medium, image_thumbnail as fallbacks
*/

CREATE OR REPLACE FUNCTION resolve_product_image(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN raw IS NULL THEN NULL
    WHEN raw LIKE 'https://%' OR raw LIKE 'http://%' THEN raw
    ELSE NULL
  END;
$$;

-- ─── get_store_products ───────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS get_store_products(text,text,uuid,numeric,numeric,boolean,text,integer,integer);

CREATE OR REPLACE FUNCTION get_store_products(
  p_store_slug text,
  p_search text DEFAULT NULL,
  p_main_category_id uuid DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock_only boolean DEFAULT false,
  p_sort text DEFAULT 'popular',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  product_id uuid, slug text, name text, description text, image_url text,
  gallery_images text[], price numeric, original_price numeric,
  discount_percentage numeric, stock integer, in_stock boolean,
  has_variants boolean, category_id uuid, main_category_id uuid,
  is_bestseller boolean, is_deal boolean, is_new_arrival boolean,
  is_trending boolean, sales_last_30_days integer, velocity_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  with store_cte as (
    select id from public.stores where slug = p_store_slug limit 1
  ),
  resolved_category_filter as (
    select c.id as category_id
    from public.categories c where c.id = p_main_category_id
    union
    select c.id as category_id
    from public.main_categories mc
    join public.categories c on lower(c.name) = lower(
      case
        when mc.name = 'Condiments & Sauces' then 'Seasonings & Condiments'
        when mc.name = 'Household' then 'Household & Cleaning'
        when mc.name = 'Tea & Coffee' then 'Tea'
        when mc.name = 'Ready to eat' then 'Ready to Eat'
        else mc.name
      end
    )
    where mc.id = p_main_category_id
  ),
  latest_metrics as (
    select distinct on (pm.product_id)
      pm.product_id, pm.sales_last_30_days, pm.velocity_score
    from public.product_metrics pm
    join store_cte st on st.id = pm.store_id
    order by pm.product_id, pm.metrics_date desc
  ),
  base as (
    select
      p.id as product_id, p.slug,
      coalesce(sp.name_override, p.name) as name,
      coalesce(sp.description_override, p.description) as description,
      coalesce(
        p.image_main,
        p.image_url,
        resolve_product_image(sp.image_cdn_url),
        resolve_product_image(sp.image_override),
        p.image_medium,
        p.image_thumbnail
      ) as image_url,
      coalesce(sp.gallery_images_override, p.gallery_images) as gallery_images,
      coalesce(sp.price_override, p.price) as price,
      p.original_price, p.discount_percentage,
      coalesce(sp.stock_override, p.stock) as stock,
      (coalesce(sp.stock_override, p.stock) > 0) as in_stock,
      p.has_variants, p.category_id, p.main_category_id,
      coalesce(pmt.is_best_seller, p.is_bestseller, false) as is_bestseller,
      coalesce(pmt.is_deal, p.is_deal, false) as is_deal,
      coalesce(pmt.is_new_arrival, p.is_new_arrival, false) as is_new_arrival,
      coalesce(pmt.is_trending, p.is_hot_product, false) as is_trending,
      lm.sales_last_30_days, lm.velocity_score
    from store_cte st
    join public.store_products sp on sp.store_id = st.id and sp.is_active = true
    join public.products p on p.id = sp.product_id and p.is_active = true
    left join public.product_marketing_tags pmt on pmt.store_id = st.id and pmt.product_id = p.id
    left join latest_metrics lm on lm.product_id = p.id
    where
      (p_main_category_id is null
        or p.category_id in (select rcf.category_id from resolved_category_filter rcf)
        or p.main_category_id = p_main_category_id)
      and (p_min_price is null or coalesce(sp.price_override, p.price) >= p_min_price)
      and (p_max_price is null or coalesce(sp.price_override, p.price) <= p_max_price)
      and (not p_in_stock_only or coalesce(sp.stock_override, p.stock) > 0)
      and (p_search is null or p_search = ''
        or coalesce(sp.name_override, p.name) ilike '%' || p_search || '%'
        or coalesce(sp.description_override, p.description) ilike '%' || p_search || '%')
  )
  select * from base
  order by
    case when p_sort = 'price_asc'  then price end asc  nulls last,
    case when p_sort = 'price_desc' then price end desc nulls last,
    case when p_sort = 'newest'     then product_id::text end desc,
    case when p_sort = 'popular'    then coalesce(velocity_score, 0) end desc,
    case when p_sort = 'popular'    then coalesce(sales_last_30_days, 0) end desc,
    product_id desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

-- ─── pocketgrocery_get_store_products ─────────────────────────────────────────
DROP FUNCTION IF EXISTS pocketgrocery_get_store_products(text,text,uuid,uuid,numeric,numeric,boolean,text,integer,integer);

CREATE OR REPLACE FUNCTION pocketgrocery_get_store_products(
  p_store_slug text,
  p_search text DEFAULT NULL,
  p_main_category_id uuid DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock_only boolean DEFAULT false,
  p_sort text DEFAULT 'popular',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  product_id uuid, slug text, name text, description text, image_url text,
  gallery_images text[], price numeric, original_price numeric,
  discount_percentage numeric, stock integer, in_stock boolean,
  has_variants boolean, category_id uuid, main_category_id uuid,
  is_bestseller boolean, is_deal boolean, is_new_arrival boolean,
  is_trending boolean, sales_last_30_days integer, velocity_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
      p.id AS product_id, p.slug,
      COALESCE(sp.name_override, p.name) AS name,
      COALESCE(sp.description_override, p.description) AS description,
      COALESCE(
        p.image_main,
        p.image_url,
        resolve_product_image(sp.image_cdn_url),
        resolve_product_image(sp.image_override),
        p.image_medium,
        p.image_thumbnail
      ) AS image_url,
      COALESCE(sp.gallery_images_override, p.gallery_images) AS gallery_images,
      COALESCE(sp.price_override, p.price) AS price,
      p.original_price, p.discount_percentage,
      COALESCE(sp.stock_override, p.stock) AS stock,
      (COALESCE(sp.stock_override, p.stock) > 0) AS in_stock,
      p.has_variants, p.category_id, p.main_category_id,
      COALESCE(pmt.is_best_seller, p.is_bestseller, false) AS is_bestseller,
      COALESCE(pmt.is_deal, p.is_deal, false) AS is_deal,
      COALESCE(pmt.is_new_arrival, p.is_new_arrival, false) AS is_new_arrival,
      COALESCE(pmt.is_trending, p.is_hot_product, false) AS is_trending,
      lm.sales_last_30_days, lm.velocity_score
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
      AND (p_search IS NULL OR p_search = ''
        OR COALESCE(sp.name_override, p.name) ILIKE '%' || p_search || '%'
        OR COALESCE(sp.description_override, p.description) ILIKE '%' || p_search || '%')
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

-- ─── pocketgrocery_get_store_page_data ────────────────────────────────────────
CREATE OR REPLACE FUNCTION pocketgrocery_get_store_page_data(
  p_store_slug text,
  p_search text DEFAULT NULL,
  p_main_category_id uuid DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock_only boolean DEFAULT false,
  p_sort text DEFAULT 'popular',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
with store_cte as (
  select s.id, s.name, s.slug, s.domain, s.color, s.visibility, s.max_display_stock
  from public.stores s where s.slug = p_store_slug limit 1
),
header_cte as (
  select jsonb_build_object(
    'store_id', st.id, 'name', st.name, 'slug', st.slug,
    'domain', st.domain, 'color', st.color, 'visibility', st.visibility,
    'max_display_stock', st.max_display_stock,
    'timezone', ss.timezone, 'default_currency', ss.default_currency,
    'tax_inclusive', ss.tax_inclusive, 'show_stock_levels', ss.show_stock_levels,
    'show_price_per_unit', ss.show_price_per_unit,
    'title_format', ss.title_format, 'decimal_places', ss.decimal_places
  ) as header
  from store_cte st left join public.store_settings ss on ss.store_id = st.id
),
categories_cte as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'main_category_id', x.main_category_id, 'name', x.name, 'slug', x.slug,
    'description', x.description, 'sort_order', x.sort_order,
    'is_active', x.is_active, 'product_count', x.product_count
  ) order by x.sort_order nulls last, x.name), '[]'::jsonb) as categories
  from (
    select mc.id as main_category_id, mc.name, mc.slug, mc.description,
           mc.sort_order, mc.is_active, count(p.id)::bigint as product_count
    from store_cte st
    join public.store_category_assignments sca on sca.store_id = st.id
    join public.main_categories mc on mc.id = sca.main_category_id
    left join public.store_products sp on sp.store_id = st.id and sp.is_active = true
    left join public.products p on p.id = sp.product_id and p.is_active = true and p.main_category_id = mc.id
    group by mc.id, mc.name, mc.slug, mc.description, mc.sort_order, mc.is_active
  ) x
),
latest_metrics as (
  select distinct on (pm.product_id)
    pm.product_id, pm.sales_last_30_days, pm.velocity_score
  from public.product_metrics pm join store_cte st on st.id = pm.store_id
  order by pm.product_id, pm.metrics_date desc
),
filtered_products as (
  select
    p.id as product_id, p.slug,
    coalesce(sp.name_override, p.name) as name,
    coalesce(sp.description_override, p.description) as description,
    coalesce(
      p.image_main,
      p.image_url,
      resolve_product_image(sp.image_cdn_url),
      resolve_product_image(sp.image_override),
      p.image_medium,
      p.image_thumbnail
    ) as image_url,
    coalesce(sp.gallery_images_override, p.gallery_images) as gallery_images,
    coalesce(sp.price_override, p.price) as price,
    p.original_price, p.discount_percentage,
    coalesce(sp.stock_override, p.stock) as stock,
    (coalesce(sp.stock_override, p.stock) > 0) as in_stock,
    p.has_variants, p.category_id, p.main_category_id,
    coalesce(pmt.is_best_seller, p.is_bestseller, false) as is_bestseller,
    coalesce(pmt.is_deal, p.is_deal, false) as is_deal,
    coalesce(pmt.is_new_arrival, p.is_new_arrival, false) as is_new_arrival,
    coalesce(pmt.is_trending, p.is_hot_product, false) as is_trending,
    lm.sales_last_30_days, lm.velocity_score
  from store_cte st
  join public.store_products sp on sp.store_id = st.id and sp.is_active = true
  join public.products p on p.id = sp.product_id and p.is_active = true
  left join public.product_marketing_tags pmt on pmt.store_id = st.id and pmt.product_id = p.id
  left join latest_metrics lm on lm.product_id = p.id
  where
    (p_main_category_id is null or p.main_category_id = p_main_category_id)
    and (p_min_price is null or coalesce(sp.price_override, p.price) >= p_min_price)
    and (p_max_price is null or coalesce(sp.price_override, p.price) <= p_max_price)
    and (not p_in_stock_only or coalesce(sp.stock_override, p.stock) > 0)
    and (p_search is null or p_search = ''
      or coalesce(sp.name_override, p.name) ilike '%' || p_search || '%'
      or coalesce(sp.description_override, p.description) ilike '%' || p_search || '%')
),
total_cte as (select count(*)::bigint as total_count from filtered_products),
products_page as (
  select * from filtered_products
  order by
    case when p_sort = 'price_asc'  then price end asc  nulls last,
    case when p_sort = 'price_desc' then price end desc nulls last,
    case when p_sort = 'newest'     then product_id::text end desc,
    case when p_sort = 'popular'    then coalesce(velocity_score, 0) end desc,
    case when p_sort = 'popular'    then coalesce(sales_last_30_days, 0) end desc,
    product_id desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0)
),
products_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', pp.product_id, 'slug', pp.slug, 'name', pp.name,
    'description', pp.description, 'image_url', pp.image_url,
    'gallery_images', pp.gallery_images, 'price', pp.price,
    'original_price', pp.original_price, 'discount_percentage', pp.discount_percentage,
    'stock', pp.stock, 'in_stock', pp.in_stock, 'has_variants', pp.has_variants,
    'category_id', pp.category_id, 'main_category_id', pp.main_category_id,
    'is_bestseller', pp.is_bestseller, 'is_deal', pp.is_deal,
    'is_new_arrival', pp.is_new_arrival, 'is_trending', pp.is_trending,
    'sales_last_30_days', pp.sales_last_30_days, 'velocity_score', pp.velocity_score
  )), '[]'::jsonb) as products from products_page pp
)
select jsonb_build_object(
  'header', coalesce((select header from header_cte), '{}'::jsonb),
  'categories', (select categories from categories_cte),
  'products', (select products from products_json),
  'total_count', coalesce((select total_count from total_cte), 0)
);
$$;

-- ─── pocketgrocery_get_store_page_data_light ──────────────────────────────────
CREATE OR REPLACE FUNCTION pocketgrocery_get_store_page_data_light(
  p_store_slug text,
  p_search text DEFAULT NULL,
  p_main_category_id uuid DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock_only boolean DEFAULT false,
  p_sort text DEFAULT 'newest',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
with store_cte as (
  select s.id, s.name, s.slug, s.domain, s.color
  from public.stores s where s.slug = p_store_slug limit 1
),
header_cte as (
  select jsonb_build_object(
    'store_id', st.id, 'name', st.name, 'slug', st.slug,
    'domain', st.domain, 'color', st.color
  ) as header from store_cte st
),
categories_cte as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'main_category_id', x.main_category_id, 'name', x.name,
    'slug', x.slug, 'product_count', x.product_count
  ) order by x.name), '[]'::jsonb) as categories
  from (
    select mc.id as main_category_id, mc.name, mc.slug, count(p.id)::bigint as product_count
    from store_cte st
    join public.store_category_assignments sca on sca.store_id = st.id
    join public.main_categories mc on mc.id = sca.main_category_id
    left join public.store_products sp on sp.store_id = st.id and sp.is_active = true
    left join public.products p on p.id = sp.product_id and p.is_active = true and p.main_category_id = mc.id
    group by mc.id, mc.name, mc.slug
  ) x
),
filtered_products as (
  select
    p.id as product_id, p.slug,
    coalesce(sp.name_override, p.name) as name,
    coalesce(
      p.image_main,
      p.image_url,
      resolve_product_image(sp.image_cdn_url),
      resolve_product_image(sp.image_override),
      p.image_medium
    ) as image_url,
    coalesce(sp.price_override, p.price) as price,
    coalesce(sp.stock_override, p.stock) as stock,
    (coalesce(sp.stock_override, p.stock) > 0) as in_stock,
    p.main_category_id
  from store_cte st
  join public.store_products sp on sp.store_id = st.id and sp.is_active = true
  join public.products p on p.id = sp.product_id and p.is_active = true
  where
    (p_main_category_id is null or p.main_category_id = p_main_category_id)
    and (p_min_price is null or coalesce(sp.price_override, p.price) >= p_min_price)
    and (p_max_price is null or coalesce(sp.price_override, p.price) <= p_max_price)
    and (not p_in_stock_only or coalesce(sp.stock_override, p.stock) > 0)
    and (p_search is null or p_search = ''
      or coalesce(sp.name_override, p.name) ilike '%' || p_search || '%')
),
total_cte as (select count(*)::bigint as total_count from filtered_products),
products_page as (
  select * from filtered_products
  order by
    case when p_sort = 'price_asc'  then price end asc  nulls last,
    case when p_sort = 'price_desc' then price end desc nulls last,
    case when p_sort = 'newest'     then product_id::text end desc,
    product_id desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0)
),
products_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', pp.product_id, 'slug', pp.slug, 'name', pp.name,
    'image_url', pp.image_url, 'price', pp.price,
    'stock', pp.stock, 'in_stock', pp.in_stock,
    'main_category_id', pp.main_category_id
  )), '[]'::jsonb) as products from products_page pp
)
select jsonb_build_object(
  'header', coalesce((select header from header_cte), '{}'::jsonb),
  'categories', (select categories from categories_cte),
  'products', (select products from products_json),
  'total_count', coalesce((select total_count from total_cte), 0)
);
$$;

-- ─── pocketgrocery_get_store_product_detail ───────────────────────────────────
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
  select s.id from public.stores s where s.slug = p_store_slug limit 1
),
latest_metrics as (
  select distinct on (pm.product_id)
    pm.product_id, pm.sales_last_30_days, pm.velocity_score
  from public.product_metrics pm
  join store_cte st on st.id = pm.store_id
  order by pm.product_id, pm.metrics_date desc
),
product_row as (
  select
    p.id as product_id, p.slug,
    coalesce(sp.name_override, p.name) as name,
    coalesce(sp.description_override, p.description) as description,
    coalesce(
      p.image_main,
      p.image_url,
      resolve_product_image(sp.image_cdn_url),
      resolve_product_image(sp.image_override),
      p.image_medium,
      p.image_thumbnail
    ) as image_url,
    coalesce(sp.gallery_images_override, p.gallery_images) as gallery_images,
    coalesce(sp.price_override, p.price) as price,
    p.original_price, p.discount_percentage,
    coalesce(sp.stock_override, p.stock) as stock,
    (coalesce(sp.stock_override, p.stock) > 0) as in_stock,
    p.has_variants, p.category_id, p.main_category_id,
    coalesce(pmt.is_best_seller, p.is_bestseller, false) as is_bestseller,
    coalesce(pmt.is_deal, p.is_deal, false) as is_deal,
    coalesce(pmt.is_new_arrival, p.is_new_arrival, false) as is_new_arrival,
    coalesce(pmt.is_trending, p.is_hot_product, false) as is_trending,
    lm.sales_last_30_days, lm.velocity_score
  from store_cte st
  join public.store_products sp on sp.store_id = st.id and sp.is_active = true
  join public.products p on p.id = sp.product_id and p.is_active = true
  left join public.product_marketing_tags pmt on pmt.store_id = st.id and pmt.product_id = p.id
  left join latest_metrics lm on lm.product_id = p.id
  where p.slug = p_product_slug
  limit 1
),
variants_agg as (
  select
    pr.product_id,
    coalesce(jsonb_agg(jsonb_build_object(
      'id', pv.id,
      'variant_name', pv.variant_name,
      'price', pv.price,
      'discounted_price', pv.discounted_price,
      'stock', pv.stock,
      'unit_value', pv.unit_value,
      'unit_type', pv.unit_type,
      'sort_order', pv.sort_order,
      'image_url', resolve_product_image(pv.image_url)
    ) order by coalesce(pv.sort_order, 999), pv.variant_name), '[]'::jsonb) as variants
  from product_row pr
  join public.product_variants pv on pv.product_id = pr.product_id and pv.is_active = true
  group by pr.product_id
)
select jsonb_build_object(
  'product_id', pr.product_id, 'slug', pr.slug, 'name', pr.name,
  'description', pr.description, 'image_url', pr.image_url,
  'gallery_images', pr.gallery_images, 'price', pr.price,
  'original_price', pr.original_price, 'discount_percentage', pr.discount_percentage,
  'stock', pr.stock, 'in_stock', pr.in_stock, 'has_variants', pr.has_variants,
  'category_id', pr.category_id, 'main_category_id', pr.main_category_id,
  'is_bestseller', pr.is_bestseller, 'is_deal', pr.is_deal,
  'is_new_arrival', pr.is_new_arrival, 'is_trending', pr.is_trending,
  'sales_last_30_days', pr.sales_last_30_days, 'velocity_score', pr.velocity_score,
  'variants', coalesce(va.variants, '[]'::jsonb)
)
from product_row pr
left join variants_agg va on va.product_id = pr.product_id;
$$;
