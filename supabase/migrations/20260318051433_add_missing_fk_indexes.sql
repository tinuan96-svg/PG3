/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add index on `hub_sync_jobs.triggered_by` for FK `hub_sync_jobs_triggered_by_fkey`
    - Add index on `store_products.suggested_category_id` for FK `store_products_suggested_category_id_fkey`

  2. Notes
    - These indexes improve JOIN performance and CASCADE operations
*/

CREATE INDEX IF NOT EXISTS idx_hub_sync_jobs_triggered_by ON public.hub_sync_jobs(triggered_by);

CREATE INDEX IF NOT EXISTS idx_store_products_suggested_category_id ON public.store_products(suggested_category_id);