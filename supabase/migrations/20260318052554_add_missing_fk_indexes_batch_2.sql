/*
  # Add Missing Foreign Key Indexes - Batch 2

  1. Performance Improvements
    - Add indexes for foreign keys on categories, customers, orders related tables

  2. Tables Affected
    - categories, competitor_prices, customer_addresses, customers
    - email_logs, expiry_alerts, google_merchant_feed, inventory
    - inventory_forecasts, inventory_movements, marketing_campaigns
*/

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_competitor_id ON public.competitor_prices(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_product_id ON public.competitor_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON public.customers(store_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_store_id ON public.email_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_acknowledged_by ON public.expiry_alerts(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_batch_id ON public.expiry_alerts(batch_id);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_product_id ON public.expiry_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_google_merchant_feed_product_id ON public.google_merchant_feed(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batch_id ON public.inventory(batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_variant_id ON public.inventory(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_location_id ON public.inventory(warehouse_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_forecasts_product_id ON public.inventory_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_batch_id ON public.inventory_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_by ON public.inventory_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_from_location_id ON public.inventory_movements(from_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_variant_id ON public.inventory_movements(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_to_location_id ON public.inventory_movements(to_location_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_store_id ON public.marketing_campaigns(store_id);