/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add index on `import_logs.connection_id` for FK `import_logs_connection_id_fkey`
    - Add index on `order_items.order_id` for FK `order_items_order_id_fkey`
    - Add index on `order_items.product_id` for FK `order_items_product_id_fkey`
    - Add index on `order_items.variation_id` for FK `order_items_variation_id_fkey`
    - Add index on `orders.user_id` for FK `orders_user_id_fkey`
    - Add index on `product_feed_items.product_id` for FK `product_feed_items_product_id_fkey`
    - Add index on `product_variations.product_id` for FK `product_variations_product_id_fkey`
    - Add index on `products.brand_id` for FK `products_brand_id_fkey`
    - Add index on `referrals.referee_id` for FK `referrals_referee_id_fkey`
    - Add index on `referrals.referrer_id` for FK `referrals_referrer_id_fkey`
    - Add index on `supplier_products.connection_id` for FK `supplier_products_connection_id_fkey`
    - Add index on `supplier_sync_logs.connection_id` for FK `supplier_sync_logs_connection_id_fkey`
    - Add index on `wallet_transactions.user_id` for FK `wallet_transactions_user_id_fkey`

  2. Notes
    - These indexes improve JOIN performance on foreign key columns
    - They also speed up CASCADE operations on parent table updates/deletes
*/

CREATE INDEX IF NOT EXISTS idx_import_logs_connection_id ON public.import_logs(connection_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_variation_id ON public.order_items(variation_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

CREATE INDEX IF NOT EXISTS idx_product_feed_items_product_id ON public.product_feed_items(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON public.product_variations(product_id);

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON public.referrals(referee_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);

CREATE INDEX IF NOT EXISTS idx_supplier_products_connection_id ON public.supplier_products(connection_id);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_connection_id ON public.supplier_sync_logs(connection_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);