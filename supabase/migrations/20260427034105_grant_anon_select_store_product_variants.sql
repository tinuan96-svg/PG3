/*
  # Grant anon SELECT on store_product_variants

  Needed by the store_products RLS policy subquery that checks variant prices.
*/

GRANT SELECT ON public.store_product_variants TO anon, authenticated;
