
/*
  # Add supplier_product_id column to products table

  ## Summary
  Adds a `supplier_product_id` column to `public.products` to store the
  originating WooCommerce product ID from the supplier feed. This enables
  the importer to detect and skip duplicate imports via upsert logic.

  ## Changes
  - `public.products`
    - New column: `supplier_product_id` (text, nullable)
      - Stores the WooCommerce product ID from the supplier
    - New unique index: `products_supplier_product_id_idx`
      - Prevents duplicate rows for the same supplier product

  ## Notes
  - Safe to re-run: uses IF NOT EXISTS guards throughout
  - No existing data is dropped or modified
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'products'
      AND column_name  = 'supplier_product_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN supplier_product_id text;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS products_supplier_product_id_idx
  ON public.products (supplier_product_id)
  WHERE supplier_product_id IS NOT NULL;
