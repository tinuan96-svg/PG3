/*
  # Drop Unused Indexes

  1. Cleanup
    - Drop indexes that have not been used according to database statistics

  2. Indexes Removed
    - idx_hub_sync_jobs_triggered_by on hub_sync_jobs (not used)
    - idx_store_products_suggested_category_id on store_products (not used)
*/

DROP INDEX IF EXISTS public.idx_hub_sync_jobs_triggered_by;
DROP INDEX IF EXISTS public.idx_store_products_suggested_category_id;