/*
  # Drop Unused Indexes - Batch 3

  1. Cleanup
    - Continue dropping unused indexes

  2. Tables Affected
    - inventory, inventory_forecasts, inventory_movements
    - marketing_campaigns, order_items, order_logs, orders
    - packaging_items, packaging_materials, packaging_movements
    - pricing_rules, product_batches, product_images, product_sales
    - product_variants, products, profit_alerts, profit_forecasts
    - profit_snapshots, promotion_products, promotions, seo_pages
    - shipments, store_carts, store_product_details
*/

DROP INDEX IF EXISTS public.idx_inventory_product_id;
DROP INDEX IF EXISTS public.idx_inventory_product_variant_id;
DROP INDEX IF EXISTS public.idx_inventory_warehouse_location_id;
DROP INDEX IF EXISTS public.idx_inventory_batch_id;
DROP INDEX IF EXISTS public.idx_inventory_forecasts_product_id;
DROP INDEX IF EXISTS public.idx_inventory_movements_product_id;
DROP INDEX IF EXISTS public.idx_inventory_movements_product_variant_id;
DROP INDEX IF EXISTS public.idx_inventory_movements_batch_id;
DROP INDEX IF EXISTS public.idx_inventory_movements_from_location_id;
DROP INDEX IF EXISTS public.idx_inventory_movements_to_location_id;
DROP INDEX IF EXISTS public.idx_inventory_movements_created_by;
DROP INDEX IF EXISTS public.idx_marketing_campaigns_store_id;
DROP INDEX IF EXISTS public.idx_order_items_order_id;
DROP INDEX IF EXISTS public.idx_order_items_product_id;
DROP INDEX IF EXISTS public.idx_order_items_product_variant_id;
DROP INDEX IF EXISTS public.idx_order_items_batch_id;
DROP INDEX IF EXISTS public.idx_order_items_warehouse_location_id;
DROP INDEX IF EXISTS public.idx_order_logs_order_id;
DROP INDEX IF EXISTS public.idx_order_logs_created_by;
DROP INDEX IF EXISTS public.idx_orders_store_id;
DROP INDEX IF EXISTS public.idx_orders_customer_id;
DROP INDEX IF EXISTS public.idx_orders_packed_by;
DROP INDEX IF EXISTS public.idx_packaging_items_store_id;
DROP INDEX IF EXISTS public.idx_packaging_items_supplier_id;
DROP INDEX IF EXISTS public.idx_packaging_materials_store_id;
DROP INDEX IF EXISTS public.idx_packaging_materials_supplier_id;
DROP INDEX IF EXISTS public.idx_packaging_movements_created_by;
DROP INDEX IF EXISTS public.idx_packaging_movements_packaging_item_id;
DROP INDEX IF EXISTS public.idx_pricing_rules_store_id;
DROP INDEX IF EXISTS public.idx_product_batches_product_id;
DROP INDEX IF EXISTS public.idx_product_batches_product_variant_id;
DROP INDEX IF EXISTS public.idx_product_batches_supplier_id;
DROP INDEX IF EXISTS public.idx_product_batches_warehouse_location_id;
DROP INDEX IF EXISTS public.idx_product_images_product_id;
DROP INDEX IF EXISTS public.idx_product_sales_product_id;
DROP INDEX IF EXISTS public.idx_product_variants_product_id;
DROP INDEX IF EXISTS public.idx_products_store_id;
DROP INDEX IF EXISTS public.idx_profit_alerts_resolved_by;
DROP INDEX IF EXISTS public.idx_profit_forecasts_store_id;
DROP INDEX IF EXISTS public.idx_profit_snapshots_store_id;
DROP INDEX IF EXISTS public.idx_promotion_products_promotion_id;
DROP INDEX IF EXISTS public.idx_promotion_products_product_id;
DROP INDEX IF EXISTS public.idx_promotions_store_id;
DROP INDEX IF EXISTS public.idx_seo_pages_store_id;
DROP INDEX IF EXISTS public.idx_shipments_order_id;
DROP INDEX IF EXISTS public.idx_store_carts_customer_id;
DROP INDEX IF EXISTS public.idx_store_carts_store_id;
DROP INDEX IF EXISTS public.idx_store_product_details_override_category_id;