
/*
  # Add profit_margin column to products table

  ## Summary
  Adds a `profit_margin` column to the `public.products` table to store the
  markup percentage applied to supplier prices when calculating the store price.

  ## Changes
  - `public.products`
    - New column: `profit_margin` (numeric, default 0)
      - Stores the percentage markup applied on top of the supplier price
      - Example: supplier_price=5.00, profit_margin=3.5 → store_price=5.175

  ## Notes
  - Uses `IF NOT EXISTS` guard to make the migration safe to re-run
  - No data is dropped or modified
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'profit_margin'
  ) THEN
    ALTER TABLE public.products ADD COLUMN profit_margin numeric DEFAULT 0;
  END IF;
END $$;
