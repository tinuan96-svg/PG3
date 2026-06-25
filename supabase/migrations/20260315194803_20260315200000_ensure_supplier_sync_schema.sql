/*
  # Ensure Supplier Sync Schema is Complete

  ## Summary
  Ensures all columns needed for the clean WooCommerce sync pipeline exist.
  This migration is idempotent and safe to run multiple times.

  ## Changes
  1. Ensures `supplier_product_id` column exists on products (WC product ID for deduplication)
  2. Ensures `supplier_connection_id` is properly indexed
  3. Adds `products_cleaned` and `duplicates_detected` columns to import_logs if missing
  4. Ensures the unique dedup index exists on products

  ## Notes
  - All operations use IF NOT EXISTS / DO blocks for safety
  - No data is dropped or lost
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'supplier_product_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN supplier_product_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'weight_value'
  ) THEN
    ALTER TABLE public.products ADD COLUMN weight_value numeric(10,3);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'weight_unit'
  ) THEN
    ALTER TABLE public.products ADD COLUMN weight_unit text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'needs_ai_image'
  ) THEN
    ALTER TABLE public.products ADD COLUMN needs_ai_image boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'import_logs' AND column_name = 'products_cleaned'
  ) THEN
    ALTER TABLE public.import_logs ADD COLUMN products_cleaned integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'import_logs' AND column_name = 'duplicates_detected'
  ) THEN
    ALTER TABLE public.import_logs ADD COLUMN duplicates_detected integer NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_supplier_connection
  ON public.products (supplier_connection_id)
  WHERE supplier_connection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_supplier_product_id
  ON public.products (supplier_product_id)
  WHERE supplier_product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_supplier_unique
  ON public.products (supplier_product_id, supplier_connection_id)
  WHERE supplier_product_id IS NOT NULL AND supplier_connection_id IS NOT NULL;
