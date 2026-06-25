/*
  # Add product content fields for detail page sections

  ## Summary
  Adds four new nullable text columns to the products table to support
  the full product detail page layout:

  ## New Columns
  - `ingredients` — ingredients list (text, nullable)
  - `nutritional_info` — nutritional information table/text (text, nullable)
  - `storage_instructions` — how to store the product (text, nullable)
  - `how_to_use` — usage instructions / cooking directions (text, nullable)

  ## Notes
  - All columns are nullable; sections on the product page only render when populated
  - No RLS changes needed — existing product policies cover these columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'ingredients'
  ) THEN
    ALTER TABLE products ADD COLUMN ingredients text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'nutritional_info'
  ) THEN
    ALTER TABLE products ADD COLUMN nutritional_info text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'storage_instructions'
  ) THEN
    ALTER TABLE products ADD COLUMN storage_instructions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'how_to_use'
  ) THEN
    ALTER TABLE products ADD COLUMN how_to_use text;
  END IF;
END $$;
