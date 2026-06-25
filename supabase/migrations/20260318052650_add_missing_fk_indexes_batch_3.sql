/*
  # Add Missing Foreign Key Indexes - Batch 3

  1. Performance Improvements
    - Add indexes for foreign keys on order and product related tables

  2. Tables Affected
    - order_items, order_logs, orders, packaging_items
    - packaging_materials, packaging_movements, pricing_rules
    - product_batches, product_images, product_variants, products
*/

CREATE INDEX IF NOT EXISTS idx_order_items_batch_id ON public.order_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_variant_id ON public.order_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_warehouse_location_id ON public.order_items(warehouse_location_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_created_by ON public.order_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON public.order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_packed_by ON public.orders(packed_by);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_packaging_items_store_id ON public.packaging_items(store_id);
CREATE INDEX IF NOT EXISTS idx_packaging_items_supplier_id ON public.packaging_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_packaging_materials_store_id ON public.packaging_materials(store_id);
CREATE INDEX IF NOT EXISTS idx_packaging_materials_supplier_id ON public.packaging_materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_packaging_movements_created_by ON public.packaging_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_packaging_movements_packaging_item_id ON public.packaging_movements(packaging_item_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_store_id ON public.pricing_rules(store_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON public.product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_product_variant_id ON public.product_batches(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_supplier_id ON public.product_batches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_warehouse_location_id ON public.product_batches(warehouse_location_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);