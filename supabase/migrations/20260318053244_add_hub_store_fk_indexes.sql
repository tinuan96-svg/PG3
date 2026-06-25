/*
  # Add Missing Foreign Key Indexes for Hub and Store Products

  1. Performance Improvements
    - Add index for hub_sync_jobs.triggered_by foreign key
    - Add index for store_products.suggested_category_id foreign key

  2. Note
    - These were previously dropped but are needed for FK constraint performance
*/

CREATE INDEX IF NOT EXISTS idx_hub_sync_jobs_triggered_by ON public.hub_sync_jobs(triggered_by);
CREATE INDEX IF NOT EXISTS idx_store_products_suggested_category_id ON public.store_products(suggested_category_id);