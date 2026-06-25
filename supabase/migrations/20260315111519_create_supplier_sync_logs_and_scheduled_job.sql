/*
  # Supplier Sync Logs Table + Scheduled Edge Function Job

  ## Summary
  This migration creates the dedicated supplier_sync_logs table and sets up a
  server-side scheduled job (pg_cron + pg_net) that calls the sync-supplier-products
  edge function every 60 seconds.

  ## 1. New Tables

  ### supplier_sync_logs
  Records every sync execution from both scheduled and manual triggers:
  - `id` (uuid, primary key)
  - `connection_id` (uuid) - FK to supplier_connections (nullable for syncAll runs)
  - `connection_name` (text) - Snapshot of connection name at time of sync
  - `triggered_by` (text) - 'scheduled' | 'manual' | 'auto'
  - `started_at` (timestamptz) - When the sync began
  - `completed_at` (timestamptz) - When the sync finished (null if still running)
  - `products_fetched` (integer) - Total products retrieved from WooCommerce API
  - `products_inserted` (integer) - New products created as drafts
  - `products_updated` (integer) - Existing products updated (stock/price)
  - `products_failed` (integer) - Products that errored during processing
  - `error_messages` (text[]) - Array of error strings
  - `supplier_api_response` (jsonb) - Raw metadata from supplier API call
  - `debug_logs` (jsonb) - Detailed per-step debug information

  ## 2. Scheduled Job
  - pg_cron job running every minute (* * * * *)
  - Calls sync-supplier-products edge function via pg_net HTTP POST
  - Uses anon key for authentication; edge function uses service role internally

  ## 3. Security
  - RLS enabled on supplier_sync_logs
  - Only admin users can read/write logs
  - Service role (edge function) bypasses RLS for write access
*/

CREATE TABLE IF NOT EXISTS supplier_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES supplier_connections(id) ON DELETE SET NULL,
  connection_name text,
  triggered_by text NOT NULL DEFAULT 'scheduled',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  products_fetched integer NOT NULL DEFAULT 0,
  products_inserted integer NOT NULL DEFAULT 0,
  products_updated integer NOT NULL DEFAULT 0,
  products_failed integer NOT NULL DEFAULT 0,
  error_messages text[],
  supplier_api_response jsonb,
  debug_logs jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE supplier_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view supplier sync logs"
  ON supplier_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert supplier sync logs"
  ON supplier_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update supplier sync logs"
  ON supplier_sync_logs FOR UPDATE
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

CREATE POLICY "Service role can manage supplier sync logs"
  ON supplier_sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_connection_id
  ON supplier_sync_logs (connection_id);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_started_at
  ON supplier_sync_logs (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_triggered_by
  ON supplier_sync_logs (triggered_by);

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing cron job with the same name before creating a new one
SELECT cron.unschedule('sync-supplier-products-every-minute')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-supplier-products-every-minute'
);

-- Schedule the sync-supplier-products edge function to run every minute
SELECT cron.schedule(
  'sync-supplier-products-every-minute',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://wuhzmjtrpprvpggchvrq.supabase.co/functions/v1/sync-supplier-products',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHptanRycHBydnBnZ2NodnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDA3NjYsImV4cCI6MjA4OTA3Njc2Nn0.ZPstINhwCu5LFdJ9wF5GOaTcSVrT1Yk3QbUYTXtTbH8"}'::jsonb,
      body := '{"syncAll": true, "triggeredBy": "scheduled"}'::jsonb
    ) AS request_id;
  $$
);
