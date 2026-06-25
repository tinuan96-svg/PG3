/*
  # AI Grocery Intelligence System Schema

  1. New Tables
    - `product_search_log` - Tracks search queries for AI trend detection
      - `id` (uuid, primary key)
      - `query` (text) - Search query text
      - `results_count` (integer) - Number of results returned
      - `source` (text) - Origin: chatbot, search_bar, voice
      - `created_at` (timestamptz)

    - `ai_product_classifications` - AI-assigned product metadata
      - `id` (uuid, primary key)
      - `product_id` (uuid) - Reference to products
      - `suggested_category` (text)
      - `suggested_subcategory` (text)
      - `suggested_brand` (text)
      - `suggested_tags` (text[])
      - `confidence` (numeric) - 0 to 1
      - `status` (text) - pending, approved, rejected
      - `created_at` (timestamptz)

    - `price_intelligence` - Competitor price tracking
      - `id` (uuid, primary key)
      - `product_name` (text)
      - `our_price` (numeric)
      - `competitor_name` (text)
      - `competitor_price` (numeric)
      - `avg_market_price` (numeric)
      - `price_position` (text) - below, at, above
      - `suggested_price` (numeric)
      - `last_checked_at` (timestamptz)
      - `created_at` (timestamptz)

    - `ai_generated_content` - AI-produced SEO and marketing content
      - `id` (uuid, primary key)
      - `content_type` (text)
      - `title` (text)
      - `content` (text)
      - `metadata` (jsonb)
      - `status` (text) - draft, published, archived
      - `created_at` (timestamptz)

    - `ai_marketing_campaigns` - AI marketing campaign management
      - `id` (uuid, primary key)
      - `campaign_name` (text)
      - `campaign_type` (text) - email, push, seasonal
      - `target_audience` (text)
      - `subject_line` (text)
      - `content` (text)
      - `products` (jsonb)
      - `scheduled_at` (timestamptz)
      - `status` (text) - draft, scheduled, sent, cancelled
      - `created_at` (timestamptz)

    - `inventory_predictions` - AI stock forecasting
      - `id` (uuid, primary key)
      - `product_id` (uuid)
      - `product_name` (text)
      - `current_stock` (integer)
      - `avg_daily_sales` (numeric)
      - `predicted_stockout_date` (timestamptz)
      - `days_until_stockout` (integer)
      - `reorder_recommended` (boolean)
      - `confidence` (numeric) - 0 to 1
      - `predicted_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Search logs: anyone can insert, admins can read
    - All other tables: admin-only access
    - Uses optimized (SELECT auth.uid()) pattern

  3. Indexes
    - Search log: query text, created_at for trending
    - Classifications: product_id, status for review workflow
    - Price intelligence: product_name, last_checked_at
    - Content: content_type, status
    - Campaigns: campaign_type, status
    - Inventory: product_id, days_until_stockout, reorder flag
*/

CREATE TABLE IF NOT EXISTS product_search_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  results_count integer DEFAULT 0,
  source text DEFAULT 'search_bar',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_log_query ON product_search_log(query);
CREATE INDEX IF NOT EXISTS idx_search_log_created ON product_search_log(created_at);

ALTER TABLE product_search_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log searches"
  ON product_search_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (source IS NOT NULL);

CREATE POLICY "Admins can view search logs"
  ON product_search_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS ai_product_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  suggested_category text,
  suggested_subcategory text,
  suggested_brand text,
  suggested_tags text[] DEFAULT '{}',
  confidence numeric(3, 2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classifications_product ON ai_product_classifications(product_id);
CREATE INDEX IF NOT EXISTS idx_classifications_status ON ai_product_classifications(status);

ALTER TABLE ai_product_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select classifications"
  ON ai_product_classifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin')
  );

CREATE POLICY "Admins can insert classifications"
  ON ai_product_classifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin')
  );

CREATE POLICY "Admins can update classifications"
  ON ai_product_classifications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can delete classifications"
  ON ai_product_classifications FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE TABLE IF NOT EXISTS price_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  our_price numeric(10, 2) NOT NULL,
  competitor_name text NOT NULL DEFAULT '',
  competitor_price numeric(10, 2),
  avg_market_price numeric(10, 2),
  price_position text DEFAULT 'at' CHECK (price_position IN ('below', 'at', 'above')),
  suggested_price numeric(10, 2),
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_intel_product ON price_intelligence(product_name);
CREATE INDEX IF NOT EXISTS idx_price_intel_checked ON price_intelligence(last_checked_at);

ALTER TABLE price_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select price intelligence"
  ON price_intelligence FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can insert price intelligence"
  ON price_intelligence FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can update price intelligence"
  ON price_intelligence FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can delete price intelligence"
  ON price_intelligence FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE TABLE IF NOT EXISTS ai_generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('product_description', 'blog_post', 'seo_page', 'email', 'category_description', 'recipe_guide')),
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_content_type ON ai_generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_status ON ai_generated_content(status);

ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select ai content"
  ON ai_generated_content FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can insert ai content"
  ON ai_generated_content FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can update ai content"
  ON ai_generated_content FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can delete ai content"
  ON ai_generated_content FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE TABLE IF NOT EXISTS ai_marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('email', 'push', 'seasonal')),
  target_audience text DEFAULT '',
  subject_line text DEFAULT '',
  content text NOT NULL DEFAULT '',
  products jsonb DEFAULT '[]'::jsonb,
  scheduled_at timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_type ON ai_marketing_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON ai_marketing_campaigns(status);

ALTER TABLE ai_marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select campaigns"
  ON ai_marketing_campaigns FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can insert campaigns"
  ON ai_marketing_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can update campaigns"
  ON ai_marketing_campaigns FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can delete campaigns"
  ON ai_marketing_campaigns FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE TABLE IF NOT EXISTS inventory_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  current_stock integer DEFAULT 0,
  avg_daily_sales numeric(10, 2) DEFAULT 0,
  predicted_stockout_date timestamptz,
  days_until_stockout integer DEFAULT 0,
  reorder_recommended boolean DEFAULT false,
  confidence numeric(3, 2) DEFAULT 0,
  predicted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_pred_product ON inventory_predictions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_pred_stockout ON inventory_predictions(days_until_stockout);
CREATE INDEX IF NOT EXISTS idx_inventory_pred_reorder ON inventory_predictions(reorder_recommended);

ALTER TABLE inventory_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select inventory predictions"
  ON inventory_predictions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can insert inventory predictions"
  ON inventory_predictions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can update inventory predictions"
  ON inventory_predictions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

CREATE POLICY "Admins can delete inventory predictions"
  ON inventory_predictions FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));
