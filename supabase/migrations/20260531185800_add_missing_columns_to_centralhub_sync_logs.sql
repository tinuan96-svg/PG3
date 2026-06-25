/*
  # Add missing columns to centralhub_sync_logs

  The sync engine references columns that weren't in the initial table creation:
  products_fetched, products_inserted, products_updated, error_messages.
  Adding them here to match the product-sync.ts code exactly.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'centralhub_sync_logs' AND column_name = 'products_fetched'
  ) THEN
    ALTER TABLE centralhub_sync_logs ADD COLUMN products_fetched integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'centralhub_sync_logs' AND column_name = 'products_inserted'
  ) THEN
    ALTER TABLE centralhub_sync_logs ADD COLUMN products_inserted integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'centralhub_sync_logs' AND column_name = 'products_updated'
  ) THEN
    ALTER TABLE centralhub_sync_logs ADD COLUMN products_updated integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'centralhub_sync_logs' AND column_name = 'error_messages'
  ) THEN
    ALTER TABLE centralhub_sync_logs ADD COLUMN error_messages text[];
  END IF;
END $$;
