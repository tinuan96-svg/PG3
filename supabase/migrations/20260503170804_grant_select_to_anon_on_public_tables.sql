/*
  # Grant SELECT to anon on product_marketing_tags and product_metrics

  The pocketgrocery_get_store_products RPC is LANGUAGE sql (runs as caller).
  When called by the anon role, it needs SELECT on every table it touches.
  product_marketing_tags and product_metrics were missing the SELECT grant,
  causing "permission denied" errors and empty product listings for all visitors.
*/

grant select on public.product_marketing_tags to anon;
grant select on public.product_metrics to anon;
grant select on public.product_marketing_tags to authenticated;
grant select on public.product_metrics to authenticated;
