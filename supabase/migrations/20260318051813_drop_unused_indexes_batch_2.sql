/*
  # Drop Unused Indexes - Batch 2

  1. Cleanup
    - Continue dropping unused indexes
    
  2. Tables Affected
    - store_product_images, catalog_product_sync_log, admin_activity_logs
    - admin_users, ai_actions, ai_config, ai_profit_insights, ai_reports
    - ai_suggestions, brands, bulk_import_jobs, bulk_import_rows
    - campaign_logs, campaigns, catalog_products, categories
    - competitor_prices, customer_addresses, customers, daily_sales
    - email_logs, expiry_alerts, feature_flags, google_merchant_feed
*/

DROP INDEX IF EXISTS public.idx_store_product_images_product;
DROP INDEX IF EXISTS public.idx_store_product_images_primary;
DROP INDEX IF EXISTS public.idx_catalog_sync_log_store;
DROP INDEX IF EXISTS public.idx_catalog_sync_log_product;
DROP INDEX IF EXISTS public.idx_admin_activity_logs_admin_id;
DROP INDEX IF EXISTS public.idx_admin_users_store_id;
DROP INDEX IF EXISTS public.idx_ai_actions_executed_by;
DROP INDEX IF EXISTS public.idx_ai_config_updated_by;
DROP INDEX IF EXISTS public.idx_ai_profit_insights_implemented_by;
DROP INDEX IF EXISTS public.idx_ai_reports_resolved_by;
DROP INDEX IF EXISTS public.idx_ai_suggestions_reviewed_by;
DROP INDEX IF EXISTS public.idx_ai_suggestions_store_id;
DROP INDEX IF EXISTS public.idx_brands_store_id;
DROP INDEX IF EXISTS public.idx_bulk_import_jobs_admin_id;
DROP INDEX IF EXISTS public.idx_bulk_import_jobs_store_id;
DROP INDEX IF EXISTS public.idx_bulk_import_rows_job_id;
DROP INDEX IF EXISTS public.idx_bulk_import_rows_product_id;
DROP INDEX IF EXISTS public.idx_campaign_logs_campaign_id;
DROP INDEX IF EXISTS public.idx_campaign_logs_customer_id;
DROP INDEX IF EXISTS public.idx_campaigns_created_by;
DROP INDEX IF EXISTS public.idx_campaigns_store_id;
DROP INDEX IF EXISTS public.idx_catalog_product_sync_log_catalog_product_id;
DROP INDEX IF EXISTS public.idx_catalog_product_sync_log_store_product_id;
DROP INDEX IF EXISTS public.idx_catalog_products_supplier_id;
DROP INDEX IF EXISTS public.idx_categories_store_id;
DROP INDEX IF EXISTS public.idx_categories_parent_id;
DROP INDEX IF EXISTS public.idx_competitor_prices_competitor_id;
DROP INDEX IF EXISTS public.idx_competitor_prices_product_id;
DROP INDEX IF EXISTS public.idx_customer_addresses_customer_id;
DROP INDEX IF EXISTS public.idx_customers_store_id;
DROP INDEX IF EXISTS public.idx_daily_sales_store_id;
DROP INDEX IF EXISTS public.idx_email_logs_store_id;
DROP INDEX IF EXISTS public.idx_expiry_alerts_acknowledged_by;
DROP INDEX IF EXISTS public.idx_expiry_alerts_batch_id;
DROP INDEX IF EXISTS public.idx_expiry_alerts_product_id;
DROP INDEX IF EXISTS public.idx_feature_flags_store_id;
DROP INDEX IF EXISTS public.idx_google_merchant_feed_product_id;