/*
  # Drop Unused Indexes

  1. Cleanup
    - Drop `idx_products_supplier_connection` on `products` table (not being used)
    - Drop `idx_store_products_product_id` on `store_products` table (not being used)

  2. Notes
    - These indexes have not been used according to database statistics
    - Removing unused indexes reduces storage and improves write performance
*/

DROP INDEX IF EXISTS public.idx_products_supplier_connection;
DROP INDEX IF EXISTS public.idx_store_products_product_id;