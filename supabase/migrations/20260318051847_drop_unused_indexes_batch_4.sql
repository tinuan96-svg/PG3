/*
  # Drop Unused Indexes - Batch 4

  1. Cleanup
    - Drop remaining unused indexes

  2. Tables Affected
    - store_product_images, store_products, supplier_price_updates
    - suppliers, support_ticket_messages, support_tickets
    - warehouse_locations, hub_sync_jobs, store_api_keys
    - product_image_gallery, catalog_products, store_category_mapping
*/

DROP INDEX IF EXISTS public.idx_store_product_images_uploaded_by;
DROP INDEX IF EXISTS public.idx_store_products_catalog_product_id;
DROP INDEX IF EXISTS public.idx_store_products_category_id;
DROP INDEX IF EXISTS public.idx_store_products_published_by;
DROP INDEX IF EXISTS public.idx_supplier_price_updates_created_by;
DROP INDEX IF EXISTS public.idx_supplier_price_updates_product_id;
DROP INDEX IF EXISTS public.idx_supplier_price_updates_supplier_id;
DROP INDEX IF EXISTS public.idx_suppliers_store_id;
DROP INDEX IF EXISTS public.idx_support_ticket_messages_ticket_id;
DROP INDEX IF EXISTS public.idx_support_tickets_store_id;
DROP INDEX IF EXISTS public.idx_support_tickets_customer_id;
DROP INDEX IF EXISTS public.idx_support_tickets_order_id;
DROP INDEX IF EXISTS public.idx_support_tickets_assigned_to;
DROP INDEX IF EXISTS public.idx_warehouse_locations_store_id;
DROP INDEX IF EXISTS public.idx_hub_sync_jobs_status;
DROP INDEX IF EXISTS public.idx_hub_sync_jobs_created_at;
DROP INDEX IF EXISTS public.idx_store_products_hub_product_id;
DROP INDEX IF EXISTS public.idx_store_api_keys_key_hash;
DROP INDEX IF EXISTS public.product_image_gallery_gtin_idx;
DROP INDEX IF EXISTS public.idx_store_api_keys_store_id;
DROP INDEX IF EXISTS public.idx_catalog_products_hub_category_id;
DROP INDEX IF EXISTS public.idx_store_category_mapping_hub_category_id;
DROP INDEX IF EXISTS public.idx_store_category_mapping_store_category_id;
DROP INDEX IF EXISTS public.idx_store_products_category_unmapped;
DROP INDEX IF EXISTS public.idx_store_products_hub_category_id;
DROP INDEX IF EXISTS public.idx_store_products_storefront;