/*
  # Drop Duplicate Index

  1. Cleanup
    - Drop duplicate index `idx_catalog_sync_log_product` on `catalog_product_sync_log`
    - Keep `idx_catalog_product_sync_log_catalog_product_id` as the canonical index

  2. Notes
    - Both indexes cover the same column, keeping one is sufficient
*/

DROP INDEX IF EXISTS public.idx_catalog_sync_log_product;