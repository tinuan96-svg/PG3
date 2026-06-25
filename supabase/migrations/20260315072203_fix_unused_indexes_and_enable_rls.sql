/*
  # Fix Security Issues: Unused Indexes and Missing RLS

  1. Enable RLS on public.users table
     - Table was created without RLS enabled
     - Add SELECT and UPDATE policies for authenticated users

  2. Drop unused indexes
     - These indexes have never been queried and add unnecessary write overhead
     - Tables: users, product_search_log, ai_product_classifications,
       price_intelligence, ai_generated_content, ai_marketing_campaigns,
       inventory_predictions
*/

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Drop unused indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_search_log_query;
DROP INDEX IF EXISTS idx_search_log_created;
DROP INDEX IF EXISTS idx_classifications_product;
DROP INDEX IF EXISTS idx_classifications_status;
DROP INDEX IF EXISTS idx_price_intel_product;
DROP INDEX IF EXISTS idx_price_intel_checked;
DROP INDEX IF EXISTS idx_ai_content_type;
DROP INDEX IF EXISTS idx_ai_content_status;
DROP INDEX IF EXISTS idx_campaigns_type;
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_inventory_pred_product;
DROP INDEX IF EXISTS idx_inventory_pred_stockout;
DROP INDEX IF EXISTS idx_inventory_pred_reorder;
