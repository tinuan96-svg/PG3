/*
  # Drop Unused Indexes

  ## Summary
  Removes indexes that have never been used in query plans. Unused indexes add
  overhead to every INSERT/UPDATE/DELETE without providing any query benefit.

  ## Indexes Dropped
  Tables affected: order_items, orders, products, referrals, import_logs,
  product_feed_items, product_variations, supplier_products,
  wallet_transactions, supplier_sync_logs.

  ## Remaining Security Items (require Dashboard action)
  - pg_net extension in public schema: pg_net does not support SET SCHEMA;
    this is a Supabase platform constraint and cannot be changed via SQL migration.
  - Leaked password protection (HIBP): must be enabled in the Supabase Dashboard
    under Authentication > Providers > Password Protection.
*/

DROP INDEX IF EXISTS public.idx_order_items_order_id;
DROP INDEX IF EXISTS public.idx_order_items_product_id;
DROP INDEX IF EXISTS public.idx_order_items_variation_id;
DROP INDEX IF EXISTS public.idx_orders_user_id;
DROP INDEX IF EXISTS public.idx_products_brand_id;
DROP INDEX IF EXISTS public.idx_referrals_referrer_id;
DROP INDEX IF EXISTS public.idx_referrals_referee_id;
DROP INDEX IF EXISTS public.idx_import_logs_connection_id;
DROP INDEX IF EXISTS public.idx_product_feed_items_product_id;
DROP INDEX IF EXISTS public.idx_product_variations_product_id;
DROP INDEX IF EXISTS public.idx_supplier_products_connection_id;
DROP INDEX IF EXISTS public.idx_wallet_transactions_user_id;
DROP INDEX IF EXISTS public.idx_supplier_sync_logs_connection_id;
DROP INDEX IF EXISTS public.idx_supplier_sync_logs_started_at;
DROP INDEX IF EXISTS public.idx_supplier_sync_logs_triggered_by;
