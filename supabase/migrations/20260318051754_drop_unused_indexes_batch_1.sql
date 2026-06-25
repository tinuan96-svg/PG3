/*
  # Drop Unused Indexes - Batch 1

  1. Cleanup
    - Drop indexes that have not been used according to database statistics
    - These indexes consume storage and slow down write operations

  2. Tables Affected
    - store_product_details, import_logs, products, ai_reports, ai_actions
    - ai_suggestions, ai_chat_history, website_health_checks, image_jobs
    - ai_activity_logs, profit_alerts, profit_snapshots, profit_forecasts
    - ai_profit_insights, catalog_products
*/

DROP INDEX IF EXISTS public.idx_store_product_details_store;
DROP INDEX IF EXISTS public.idx_import_logs_created_at;
DROP INDEX IF EXISTS public.idx_products_published;
DROP INDEX IF EXISTS public.idx_products_in_stock;
DROP INDEX IF EXISTS public.idx_products_type;
DROP INDEX IF EXISTS public.idx_products_gtin;
DROP INDEX IF EXISTS public.idx_store_product_details_category;
DROP INDEX IF EXISTS public.idx_store_products_store_id;
DROP INDEX IF EXISTS public.idx_products_category_id;
DROP INDEX IF EXISTS public.idx_store_products_store_id_status;
DROP INDEX IF EXISTS public.idx_ai_reports_store_id;
DROP INDEX IF EXISTS public.idx_ai_reports_report_type;
DROP INDEX IF EXISTS public.idx_ai_reports_severity;
DROP INDEX IF EXISTS public.idx_ai_reports_created_at;
DROP INDEX IF EXISTS public.idx_ai_actions_action_type;
DROP INDEX IF EXISTS public.idx_ai_actions_status;
DROP INDEX IF EXISTS public.idx_ai_actions_created_at;
DROP INDEX IF EXISTS public.idx_ai_suggestions_category;
DROP INDEX IF EXISTS public.idx_ai_suggestions_status;
DROP INDEX IF EXISTS public.idx_ai_suggestions_priority;
DROP INDEX IF EXISTS public.idx_ai_chat_history_admin_id;
DROP INDEX IF EXISTS public.idx_ai_chat_history_session_id;
DROP INDEX IF EXISTS public.idx_health_checks_store_id;
DROP INDEX IF EXISTS public.idx_health_checks_type;
DROP INDEX IF EXISTS public.idx_health_checks_created_at;
DROP INDEX IF EXISTS public.idx_image_jobs_status;
DROP INDEX IF EXISTS public.idx_products_gtin_source;
DROP INDEX IF EXISTS public.idx_products_gtin_valid;
DROP INDEX IF EXISTS public.idx_products_ai_status;
DROP INDEX IF EXISTS public.idx_ai_activity_logs_product_id;
DROP INDEX IF EXISTS public.idx_ai_activity_logs_action;
DROP INDEX IF EXISTS public.idx_profit_alerts_store_id;
DROP INDEX IF EXISTS public.idx_profit_alerts_entity;
DROP INDEX IF EXISTS public.idx_profit_alerts_unresolved;
DROP INDEX IF EXISTS public.idx_profit_alerts_severity;
DROP INDEX IF EXISTS public.idx_profit_alerts_created_at;
DROP INDEX IF EXISTS public.idx_profit_snapshots_store_date;
DROP INDEX IF EXISTS public.idx_profit_snapshots_date;
DROP INDEX IF EXISTS public.idx_profit_forecasts_store_period;
DROP INDEX IF EXISTS public.idx_ai_profit_insights_store;
DROP INDEX IF EXISTS public.idx_ai_profit_insights_type;
DROP INDEX IF EXISTS public.idx_ai_profit_insights_priority;
DROP INDEX IF EXISTS public.idx_ai_profit_insights_unimplemented;
DROP INDEX IF EXISTS public.idx_catalog_products_gtin;
DROP INDEX IF EXISTS public.idx_catalog_products_name;
DROP INDEX IF EXISTS public.idx_catalog_products_brand;
DROP INDEX IF EXISTS public.idx_catalog_products_active;