/*
  # Add Missing Foreign Key Indexes - Batch 4

  1. Performance Improvements
    - Add indexes for remaining foreign keys

  2. Tables Affected
    - profit_alerts, promotion_products, promotions, seo_pages
    - shipments, store_api_keys, store_carts, store_category_mapping
    - store_product_details, store_product_images, store_products
    - supplier_price_updates, suppliers, support_ticket_messages
    - support_tickets, warehouse_locations, website_health_checks
*/

CREATE INDEX IF NOT EXISTS idx_profit_alerts_resolved_by ON public.profit_alerts(resolved_by);
CREATE INDEX IF NOT EXISTS idx_profit_alerts_store_id ON public.profit_alerts(store_id);
CREATE INDEX IF NOT EXISTS idx_promotion_products_product_id ON public.promotion_products(product_id);
CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion_id ON public.promotion_products(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotions_store_id ON public.promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_seo_pages_store_id ON public.seo_pages(store_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_store_api_keys_store_id ON public.store_api_keys(store_id);
CREATE INDEX IF NOT EXISTS idx_store_carts_customer_id ON public.store_carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_store_carts_store_id ON public.store_carts(store_id);
CREATE INDEX IF NOT EXISTS idx_store_category_mapping_hub_category_id ON public.store_category_mapping(hub_category_id);
CREATE INDEX IF NOT EXISTS idx_store_category_mapping_store_category_id ON public.store_category_mapping(store_category_id);
CREATE INDEX IF NOT EXISTS idx_store_product_details_category_id ON public.store_product_details(category_id);
CREATE INDEX IF NOT EXISTS idx_store_product_details_override_category_id ON public.store_product_details(override_category_id);
CREATE INDEX IF NOT EXISTS idx_store_product_details_store_id ON public.store_product_details(store_id);
CREATE INDEX IF NOT EXISTS idx_store_product_images_store_product_id ON public.store_product_images(store_product_id);
CREATE INDEX IF NOT EXISTS idx_store_product_images_uploaded_by ON public.store_product_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_store_products_catalog_product_id ON public.store_products(catalog_product_id);
CREATE INDEX IF NOT EXISTS idx_store_products_category_id ON public.store_products(category_id);
CREATE INDEX IF NOT EXISTS idx_store_products_hub_category_id ON public.store_products(hub_category_id);
CREATE INDEX IF NOT EXISTS idx_store_products_published_by ON public.store_products(published_by);
CREATE INDEX IF NOT EXISTS idx_supplier_price_updates_created_by ON public.supplier_price_updates(created_by);
CREATE INDEX IF NOT EXISTS idx_supplier_price_updates_product_id ON public.supplier_price_updates(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_price_updates_supplier_id ON public.supplier_price_updates(supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_store_id ON public.suppliers(store_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON public.support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order_id ON public.support_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_store_id ON public.support_tickets(store_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_store_id ON public.warehouse_locations(store_id);
CREATE INDEX IF NOT EXISTS idx_website_health_checks_store_id ON public.website_health_checks(store_id);