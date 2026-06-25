/*
  # Grant anon SELECT on all tables needed by the store RPCs

  ## Problem
  pocketgrocery_get_store_page_data and pocketgrocery_get_store_products are
  SECURITY INVOKER functions, so they run as the calling role (anon for public
  visitors). Several tables they JOIN were missing GRANT SELECT TO anon, causing
  permission denied errors that returned zero products.

  ## Tables fixed
  - stores (needed to resolve store slug)
  - store_settings (store header settings)
  - main_categories (category list in store page)
  - store_category_assignments (maps categories to stores)
  - product_marketing_tags (bestseller/deal/trending flags)
  - product_metrics (velocity/sales data for sorting)

  ## Security
  RLS policies on each table still control row-level visibility.
  GRANT SELECT only allows the role to attempt reads; RLS decides what rows
  are actually returned.
*/

GRANT SELECT ON public.stores TO anon, authenticated;
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT SELECT ON public.main_categories TO anon, authenticated;
GRANT SELECT ON public.store_category_assignments TO anon, authenticated;
GRANT SELECT ON public.product_marketing_tags TO anon, authenticated;
GRANT SELECT ON public.product_metrics TO anon, authenticated;
