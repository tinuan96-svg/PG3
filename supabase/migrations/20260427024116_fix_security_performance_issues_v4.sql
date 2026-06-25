/*
  # Fix Security and Performance Issues (v4)

  ## Summary
  Final comprehensive fix using exact function signatures.

  1. Drop 93 unused indexes
  2. Add 16 missing FK indexes
  3. Consolidate duplicate permissive policies on products
  4. Replace 30 always-true RLS policies with admin-only checks
  5. Fix mutable search_path on 30 functions (with exact signatures for overloads)
  6. Convert SECURITY DEFINER view to SECURITY INVOKER
*/

-- ============================================================================
-- PART 1: DROP UNUSED INDEXES
-- ============================================================================
DROP INDEX IF EXISTS public.idx_ai_actions_approved_by;
DROP INDEX IF EXISTS public.idx_ai_actions_insight_id;
DROP INDEX IF EXISTS public.idx_ai_suggestions_log_accepted_by;
DROP INDEX IF EXISTS public.idx_alert_history_issue_id;
DROP INDEX IF EXISTS public.idx_alert_history_scan_id;
DROP INDEX IF EXISTS public.idx_alert_history_trust_score_id;
DROP INDEX IF EXISTS public.idx_audience_members_user_id;
DROP INDEX IF EXISTS public.idx_backorder_items_product_id;
DROP INDEX IF EXISTS public.idx_campaign_conversions_campaign_id;
DROP INDEX IF EXISTS public.idx_campaigns_created_by;
DROP INDEX IF EXISTS public.idx_cart_product_id;
DROP INDEX IF EXISTS public.idx_comm_automations_template_id;
DROP INDEX IF EXISTS public.idx_comm_events_order_id;
DROP INDEX IF EXISTS public.idx_cost_history_product_id;
DROP INDEX IF EXISTS public.idx_cost_history_supplier_id;
DROP INDEX IF EXISTS public.idx_data_health_metrics_scan_id;
DROP INDEX IF EXISTS public.idx_data_integrity_issues_fixed_by;
DROP INDEX IF EXISTS public.idx_data_integrity_scans_triggered_by;
DROP INDEX IF EXISTS public.idx_expenses_supplier_id;
DROP INDEX IF EXISTS public.idx_gateway_fee_rules_gateway_id;
DROP INDEX IF EXISTS public.idx_gateway_fee_statistics_gateway_id;
DROP INDEX IF EXISTS public.idx_gateway_transactions_gateway_id;
DROP INDEX IF EXISTS public.idx_homepage_section_products_product_id;
DROP INDEX IF EXISTS public.idx_inventory_logs_store_id;
DROP INDEX IF EXISTS public.idx_marketing_events_product_id;
DROP INDEX IF EXISTS public.idx_marketing_events_user_id;
DROP INDEX IF EXISTS public.idx_marketing_insights_campaign_id;
DROP INDEX IF EXISTS public.idx_material_po_items_material_id;
DROP INDEX IF EXISTS public.idx_message_campaigns_template_id;
DROP INDEX IF EXISTS public.idx_messages_order_id;
DROP INDEX IF EXISTS public.idx_messages_template_id;
DROP INDEX IF EXISTS public.idx_order_packing_packed_by;
DROP INDEX IF EXISTS public.idx_order_packing_suggested_box_id;
DROP INDEX IF EXISTS public.idx_order_packing_items_material_id;
DROP INDEX IF EXISTS public.idx_order_packing_items_order_packing_id;
DROP INDEX IF EXISTS public.idx_order_status_history_created_by;
DROP INDEX IF EXISTS public.idx_order_status_history_order_id;
DROP INDEX IF EXISTS public.idx_orders_gateway_id;
DROP INDEX IF EXISTS public.idx_orders_user_id;
DROP INDEX IF EXISTS public.idx_packing_learning_actual_box_id;
DROP INDEX IF EXISTS public.idx_packing_learning_suggested_box_id;
DROP INDEX IF EXISTS public.idx_packing_material_txn_material_id;
DROP INDEX IF EXISTS public.idx_payout_batches_gateway_id;
DROP INDEX IF EXISTS public.idx_po_drafts_supplier_id;
DROP INDEX IF EXISTS public.idx_pricing_suggestions_store_id;
DROP INDEX IF EXISTS public.idx_pricing_suggestions_product_id;
DROP INDEX IF EXISTS public.idx_product_batches_store_id;
DROP INDEX IF EXISTS public.idx_product_batches_supplier_id;
DROP INDEX IF EXISTS public.idx_product_expiry_product_id;
DROP INDEX IF EXISTS public.idx_product_feeds_product_id;
DROP INDEX IF EXISTS public.idx_product_marketing_tags_store_id;
DROP INDEX IF EXISTS public.idx_product_metrics_store_id;
DROP INDEX IF EXISTS public.idx_product_supplier_map_supplier_id;
DROP INDEX IF EXISTS public.idx_product_supplier_mappings_supplier_id;
DROP INDEX IF EXISTS public.idx_product_supplier_mappings_price_list_id;
DROP INDEX IF EXISTS public.idx_product_suppliers_supplier_id;
DROP INDEX IF EXISTS public.idx_product_sync_logs_created_by;
DROP INDEX IF EXISTS public.idx_product_sync_logs_product_id;
DROP INDEX IF EXISTS public.idx_product_sync_logs_store_id;
DROP INDEX IF EXISTS public.idx_product_warehouse_locations_store_id;
DROP INDEX IF EXISTS public.idx_profit_analytics_store_id;
DROP INDEX IF EXISTS public.idx_promotion_items_campaign_id;
DROP INDEX IF EXISTS public.idx_promotion_items_product_id;
DROP INDEX IF EXISTS public.idx_promotion_rules_campaign_id;
DROP INDEX IF EXISTS public.idx_purchase_order_items_product_id;
DROP INDEX IF EXISTS public.idx_purchase_order_items_price_list_id;
DROP INDEX IF EXISTS public.idx_purchase_orders_created_by;
DROP INDEX IF EXISTS public.idx_purchase_orders_store_id;
DROP INDEX IF EXISTS public.idx_purchase_orders_supplier_id;
DROP INDEX IF EXISTS public.idx_purchase_plan_suggestions_product_id;
DROP INDEX IF EXISTS public.idx_purchase_plan_suggestions_supplier_id;
DROP INDEX IF EXISTS public.idx_shipment_events_shipment_id;
DROP INDEX IF EXISTS public.idx_shipments_order_id;
DROP INDEX IF EXISTS public.idx_stock_replenishment_product_id;
DROP INDEX IF EXISTS public.idx_stock_replenishment_supplier_id;
DROP INDEX IF EXISTS public.idx_store_category_assignments_category_id;
DROP INDEX IF EXISTS public.idx_supplier_contacts_supplier_id;
DROP INDEX IF EXISTS public.idx_supplier_material_prices_material_id;
DROP INDEX IF EXISTS public.idx_supplier_payments_created_by;
DROP INDEX IF EXISTS public.idx_supplier_payments_invoice_id;
DROP INDEX IF EXISTS public.idx_supplier_payments_supplier_id;
DROP INDEX IF EXISTS public.idx_supplier_price_lists_product_id;
DROP INDEX IF EXISTS public.idx_supplier_price_lists_supplier_id;
DROP INDEX IF EXISTS public.idx_transactions_user_id;
DROP INDEX IF EXISTS public.idx_trust_scores_store_id;
DROP INDEX IF EXISTS public.idx_user_actions_user_id;
DROP INDEX IF EXISTS public.idx_utm_links_campaign_id;
DROP INDEX IF EXISTS public.idx_utm_links_created_by;
DROP INDEX IF EXISTS public.idx_variant_analytics_store_id;
DROP INDEX IF EXISTS public.idx_products_main_category_id;
DROP INDEX IF EXISTS public.idx_main_categories_is_active;
DROP INDEX IF EXISTS public.idx_products_expiry_date;

-- ============================================================================
-- PART 2: ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_log_product_id
  ON public.ai_suggestions_log(product_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_sent_to_user_id
  ON public.alert_history(sent_to_user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_log_performed_by
  ON public.bulk_operations_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_data_integrity_issues_scan_id
  ON public.data_integrity_issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_packing_material_transactions_created_by
  ON public.packing_material_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_category_id
  ON public.pricing_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_product_id
  ON public.pricing_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_store_id
  ON public.pricing_rules(store_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_product_id
  ON public.product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_bundle_product_id
  ON public.product_bundles(bundle_product_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_component_product_id
  ON public.product_bundles(component_product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_warehouse_locations_product_id
  ON public.product_warehouse_locations(product_id);
CREATE INDEX IF NOT EXISTS idx_store_deletion_audit_deleted_by
  ON public.store_deletion_audit(deleted_by);
CREATE INDEX IF NOT EXISTS idx_store_product_variants_variant_id
  ON public.store_product_variants(variant_id);
CREATE INDEX IF NOT EXISTS idx_trust_score_history_trust_score_id
  ON public.trust_score_history(trust_score_id);

-- ============================================================================
-- PART 3: FIX MULTIPLE PERMISSIVE POLICIES ON products
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Users can soft delete products" ON public.products;
DROP POLICY IF EXISTS "Users can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
    AND policyname = 'Users can view products'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users can view products" ON public.products
        FOR SELECT TO authenticated
        USING (is_active = true OR (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
    $p$;
  END IF;
END $$;

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- ============================================================================
-- PART 4: FIX ALWAYS-TRUE RLS POLICIES
-- ============================================================================

-- ai_suggestions_log
DROP POLICY IF EXISTS "Authenticated users can manage AI suggestions log" ON public.ai_suggestions_log;
DROP POLICY IF EXISTS "Admins can manage AI suggestions log" ON public.ai_suggestions_log;
CREATE POLICY "Admins can manage AI suggestions log" ON public.ai_suggestions_log
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- bank_transactions
DROP POLICY IF EXISTS "Authenticated users can delete bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Authenticated users can update bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Admins can delete bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Admins can insert bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Admins can update bank transactions" ON public.bank_transactions;
CREATE POLICY "Admins can delete bank transactions" ON public.bank_transactions
  FOR DELETE TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');
CREATE POLICY "Admins can insert bank transactions" ON public.bank_transactions
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');
CREATE POLICY "Admins can update bank transactions" ON public.bank_transactions
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- brands
DROP POLICY IF EXISTS "Authenticated users can create brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can create brands" ON public.brands;
CREATE POLICY "Admins can create brands" ON public.brands
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- bulk_operations_log
DROP POLICY IF EXISTS "Authenticated users can manage bulk operations log" ON public.bulk_operations_log;
DROP POLICY IF EXISTS "Admins can manage bulk operations log" ON public.bulk_operations_log;
CREATE POLICY "Admins can manage bulk operations log" ON public.bulk_operations_log
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- data_health_metrics
DROP POLICY IF EXISTS "Authenticated users can insert health metrics" ON public.data_health_metrics;
DROP POLICY IF EXISTS "Admins can insert health metrics" ON public.data_health_metrics;
CREATE POLICY "Admins can insert health metrics" ON public.data_health_metrics
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- data_integrity_issues
DROP POLICY IF EXISTS "Authenticated users can manage issues" ON public.data_integrity_issues;
DROP POLICY IF EXISTS "Admins can manage integrity issues" ON public.data_integrity_issues;
CREATE POLICY "Admins can manage integrity issues" ON public.data_integrity_issues
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- data_integrity_scans
DROP POLICY IF EXISTS "Authenticated users can create scans" ON public.data_integrity_scans;
DROP POLICY IF EXISTS "Admins can create scans" ON public.data_integrity_scans;
CREATE POLICY "Admins can create scans" ON public.data_integrity_scans
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- main_categories
DROP POLICY IF EXISTS "Authenticated users can delete main categories" ON public.main_categories;
DROP POLICY IF EXISTS "Authenticated users can insert main categories" ON public.main_categories;
DROP POLICY IF EXISTS "Authenticated users can update main categories" ON public.main_categories;
DROP POLICY IF EXISTS "Admins can delete main categories" ON public.main_categories;
DROP POLICY IF EXISTS "Admins can insert main categories" ON public.main_categories;
DROP POLICY IF EXISTS "Admins can update main categories" ON public.main_categories;
CREATE POLICY "Admins can delete main categories" ON public.main_categories
  FOR DELETE TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');
CREATE POLICY "Admins can insert main categories" ON public.main_categories
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');
CREATE POLICY "Admins can update main categories" ON public.main_categories
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- product_batches
DROP POLICY IF EXISTS "Users can manage product batches" ON public.product_batches;
DROP POLICY IF EXISTS "Admins can manage product batches" ON public.product_batches;
CREATE POLICY "Admins can manage product batches" ON public.product_batches
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- product_bundles
DROP POLICY IF EXISTS "Users can manage product bundles" ON public.product_bundles;
DROP POLICY IF EXISTS "Admins can manage product bundles" ON public.product_bundles;
CREATE POLICY "Admins can manage product bundles" ON public.product_bundles
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- product_marketing_tags
DROP POLICY IF EXISTS "Users can manage marketing tags" ON public.product_marketing_tags;
DROP POLICY IF EXISTS "Admins can manage marketing tags" ON public.product_marketing_tags;
CREATE POLICY "Admins can manage marketing tags" ON public.product_marketing_tags
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- product_metrics
DROP POLICY IF EXISTS "Authenticated users can manage product metrics" ON public.product_metrics;
DROP POLICY IF EXISTS "Admins can manage product metrics" ON public.product_metrics;
CREATE POLICY "Admins can manage product metrics" ON public.product_metrics
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- product_suppliers
DROP POLICY IF EXISTS "Users can manage product suppliers" ON public.product_suppliers;
DROP POLICY IF EXISTS "Admins can manage product suppliers" ON public.product_suppliers;
CREATE POLICY "Admins can manage product suppliers" ON public.product_suppliers
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- product_variants
DROP POLICY IF EXISTS "Users can manage product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
CREATE POLICY "Admins can manage product variants" ON public.product_variants
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- product_warehouse_locations
DROP POLICY IF EXISTS "Users can manage warehouse locations" ON public.product_warehouse_locations;
DROP POLICY IF EXISTS "Admins can manage warehouse locations" ON public.product_warehouse_locations;
CREATE POLICY "Admins can manage warehouse locations" ON public.product_warehouse_locations
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- store_bank_accounts
DROP POLICY IF EXISTS "Authenticated users can delete store bank accounts" ON public.store_bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can insert store bank accounts" ON public.store_bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can update store bank accounts" ON public.store_bank_accounts;
DROP POLICY IF EXISTS "Admins can delete store bank accounts" ON public.store_bank_accounts;
DROP POLICY IF EXISTS "Admins can insert store bank accounts" ON public.store_bank_accounts;
DROP POLICY IF EXISTS "Admins can update store bank accounts" ON public.store_bank_accounts;
CREATE POLICY "Admins can delete store bank accounts" ON public.store_bank_accounts
  FOR DELETE TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');
CREATE POLICY "Admins can insert store bank accounts" ON public.store_bank_accounts
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');
CREATE POLICY "Admins can update store bank accounts" ON public.store_bank_accounts
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- store_brand_assignments
DROP POLICY IF EXISTS "Authenticated users can delete store brand assignments" ON public.store_brand_assignments;
DROP POLICY IF EXISTS "Authenticated users can insert store brand assignments" ON public.store_brand_assignments;
DROP POLICY IF EXISTS "Admins can delete store brand assignments" ON public.store_brand_assignments;
DROP POLICY IF EXISTS "Admins can insert store brand assignments" ON public.store_brand_assignments;
CREATE POLICY "Admins can delete store brand assignments" ON public.store_brand_assignments
  FOR DELETE TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');
CREATE POLICY "Admins can insert store brand assignments" ON public.store_brand_assignments
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- store_category_assignments
DROP POLICY IF EXISTS "Authenticated users can delete store category assignments" ON public.store_category_assignments;
DROP POLICY IF EXISTS "Authenticated users can insert store category assignments" ON public.store_category_assignments;
DROP POLICY IF EXISTS "Admins can delete store category assignments" ON public.store_category_assignments;
DROP POLICY IF EXISTS "Admins can insert store category assignments" ON public.store_category_assignments;
CREATE POLICY "Admins can delete store category assignments" ON public.store_category_assignments
  FOR DELETE TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');
CREATE POLICY "Admins can insert store category assignments" ON public.store_category_assignments
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- store_product_variants
DROP POLICY IF EXISTS "Authenticated users can manage store variant pricing" ON public.store_product_variants;
DROP POLICY IF EXISTS "Admins can manage store variant pricing" ON public.store_product_variants;
CREATE POLICY "Admins can manage store variant pricing" ON public.store_product_variants
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- store_settings
DROP POLICY IF EXISTS "Authenticated users can manage store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can manage store settings" ON public.store_settings;
CREATE POLICY "Admins can manage store settings" ON public.store_settings
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- trust_score_history
DROP POLICY IF EXISTS "Authenticated users can insert trust score history" ON public.trust_score_history;
DROP POLICY IF EXISTS "Admins can insert trust score history" ON public.trust_score_history;
CREATE POLICY "Admins can insert trust score history" ON public.trust_score_history
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- trust_scores
DROP POLICY IF EXISTS "Authenticated users can update trust scores" ON public.trust_scores;
DROP POLICY IF EXISTS "Admins can manage trust scores" ON public.trust_scores;
CREATE POLICY "Admins can manage trust scores" ON public.trust_scores
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- variant_analytics
DROP POLICY IF EXISTS "Authenticated users can manage variant analytics" ON public.variant_analytics;
DROP POLICY IF EXISTS "Admins can manage variant analytics" ON public.variant_analytics;
CREATE POLICY "Admins can manage variant analytics" ON public.variant_analytics
  FOR ALL TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- ============================================================================
-- PART 5: FIX FUNCTION SEARCH PATHS (exact signatures)
-- ============================================================================
ALTER FUNCTION public.auto_format_product_titles()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.auto_generate_variants(uuid, numeric, text, numeric[], numeric, numeric, numeric)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_data_health()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_demand_score(integer, integer, integer, integer)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_dynamic_price(numeric, uuid, uuid, uuid, integer, numeric)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_expected_payout(uuid, text, date, date)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_price_per_unit(numeric, numeric, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_trust_score(text, text, uuid, uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.detect_orphan_records(text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.find_matching_transactions(uuid, text, numeric, date, integer, numeric)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.format_product_title(text, text, text, numeric, text, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.fuzzy_match_brand(text, numeric)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_product_slug(text, text, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_product_slug(text, text, text, uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_variant_sku(uuid, numeric, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_applicable_pricing_rules(uuid, uuid, uuid, integer)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_best_selling_variant(uuid, integer)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_store_title_format(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.invalidate_pricing_cache()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.is_pricing_rule_active(timestamptz, timestamptz, boolean)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.normalize_bank_transaction()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.suggest_optimal_price(numeric, numeric, integer, integer, integer)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.sync_bank_transactions(uuid, jsonb)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.track_trust_score_change()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.trigger_update_product_title()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_integrity_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_product_metrics(uuid, uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_product_metrics_timestamp()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_product_tables_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_reconciliation_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_seo_data_timestamp()
  SET search_path = public, pg_temp;

-- ============================================================================
-- PART 6: FIX SECURITY DEFINER VIEW
-- ============================================================================
DROP VIEW IF EXISTS public.pricing_rules_with_scope CASCADE;

CREATE VIEW public.pricing_rules_with_scope
WITH (security_invoker = true) AS
SELECT
  pr.*,
  CASE
    WHEN pr.product_id IS NOT NULL THEN 'product'
    WHEN pr.category_id IS NOT NULL THEN 'category'
    WHEN pr.store_id IS NOT NULL THEN 'store'
    ELSE 'global'
  END AS scope_type
FROM public.pricing_rules pr;
