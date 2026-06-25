/*
  # Add Missing Foreign Key Indexes - Batch 1

  1. Performance Improvements
    - Add indexes for foreign keys on admin/AI related tables
    - These indexes improve JOIN performance and CASCADE operations

  2. Tables Affected
    - admin_activity_logs, admin_users, ai_actions, ai_activity_logs
    - ai_chat_history, ai_config, ai_profit_insights, ai_reports
    - ai_suggestions, brands, bulk_import_jobs, bulk_import_rows
    - campaign_logs, campaigns, catalog_product_sync_log, catalog_products
*/

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_store_id ON public.admin_users(store_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_executed_by ON public.ai_actions(executed_by);
CREATE INDEX IF NOT EXISTS idx_ai_activity_logs_product_id ON public.ai_activity_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_admin_id ON public.ai_chat_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_ai_config_updated_by ON public.ai_config(updated_by);
CREATE INDEX IF NOT EXISTS idx_ai_profit_insights_implemented_by ON public.ai_profit_insights(implemented_by);
CREATE INDEX IF NOT EXISTS idx_ai_profit_insights_store_id ON public.ai_profit_insights(store_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_resolved_by ON public.ai_reports(resolved_by);
CREATE INDEX IF NOT EXISTS idx_ai_reports_store_id ON public.ai_reports(store_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_reviewed_by ON public.ai_suggestions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_store_id ON public.ai_suggestions(store_id);
CREATE INDEX IF NOT EXISTS idx_brands_store_id ON public.brands(store_id);
CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_admin_id ON public.bulk_import_jobs(admin_id);
CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_store_id ON public.bulk_import_jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_bulk_import_rows_job_id ON public.bulk_import_rows(job_id);
CREATE INDEX IF NOT EXISTS idx_bulk_import_rows_product_id ON public.bulk_import_rows(product_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON public.campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_customer_id ON public.campaign_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_store_id ON public.campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_sync_log_catalog_product_id ON public.catalog_product_sync_log(catalog_product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_sync_log_store_id ON public.catalog_product_sync_log(store_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_sync_log_store_product_id ON public.catalog_product_sync_log(store_product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_hub_category_id ON public.catalog_products(hub_category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_supplier_id ON public.catalog_products(supplier_id);