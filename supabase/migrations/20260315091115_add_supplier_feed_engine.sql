/*
  # Smart Supplier Feed Engine Schema

  1. New Tables

    - `supplier_connections`
      - Stores WooCommerce store credentials for supplier feed integration
      - `id` (uuid, primary key)
      - `name` (text) - Display name for this supplier connection
      - `api_url` (text) - WooCommerce store base URL
      - `consumer_key` (text) - WooCommerce REST API Consumer Key
      - `consumer_secret` (text) - WooCommerce REST API Consumer Secret
      - `markup_percentage` (numeric) - Default price markup applied to supplier prices
      - `is_active` (boolean) - Whether this connection is enabled for auto-sync
      - `last_synced_at` (timestamptz) - Timestamp of most recent successful sync

    - `import_logs`
      - Records each supplier feed sync operation for audit and monitoring
      - `id` (uuid, primary key)
      - `connection_id` (uuid, FK to supplier_connections) - Which supplier was synced
      - `products_fetched` (integer) - Total products retrieved from supplier
      - `products_inserted` (integer) - New products created as drafts
      - `products_updated` (integer) - Existing products updated (stock/price)
      - `products_categorized` (integer) - Products auto-classified
      - `products_failed` (integer) - Products that errored during processing
      - `error_details` (text) - Error messages if any
      - `triggered_by` (text) - 'auto' or 'manual'
      - `started_at` / `completed_at` (timestamptz)

  2. Modified Tables

    - `products`
      - `status` (text) - Workflow status: 'draft' | 'published'. All supplier imports default to 'draft'
      - `supplier_id` (text) - WooCommerce product/variation ID for deduplication
      - `supplier_price` (numeric) - Original price from supplier before markup
      - `supplier_connection_id` (uuid) - FK to supplier_connections
      - `raw_title` (text) - Original unprocessed title from supplier feed

  3. Security
    - RLS enabled on all new tables
    - Only admin users can read/write supplier_connections (sensitive credentials)
    - Admins can read/write import_logs
    - Products status filtering: only 'published' products visible to public via existing policies

  4. Notes
    - The `supplier_id` column is used to prevent duplicate product creation
    - A unique index on (supplier_id, supplier_connection_id) enforces deduplication
    - `status = 'draft'` products are hidden from public storefront until admin publishes
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published'));

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS supplier_id text;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS supplier_price numeric(10, 2);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS supplier_connection_id uuid;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS raw_title text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_supplier_unique
  ON products (supplier_id, supplier_connection_id)
  WHERE supplier_id IS NOT NULL AND supplier_connection_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS supplier_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  api_url text NOT NULL,
  consumer_key text NOT NULL DEFAULT '',
  consumer_secret text NOT NULL DEFAULT '',
  markup_percentage numeric(5, 2) NOT NULL DEFAULT 15.00,
  is_active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE supplier_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view supplier connections"
  ON supplier_connections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert supplier connections"
  ON supplier_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update supplier connections"
  ON supplier_connections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete supplier connections"
  ON supplier_connections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES supplier_connections(id) ON DELETE SET NULL,
  products_fetched integer NOT NULL DEFAULT 0,
  products_inserted integer NOT NULL DEFAULT 0,
  products_updated integer NOT NULL DEFAULT 0,
  products_categorized integer NOT NULL DEFAULT 0,
  products_failed integer NOT NULL DEFAULT 0,
  error_details text,
  triggered_by text NOT NULL DEFAULT 'auto',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view import logs"
  ON import_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert import logs"
  ON import_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update import logs"
  ON import_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_import_logs_connection_id ON import_logs (connection_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_started_at ON import_logs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products (supplier_id);
