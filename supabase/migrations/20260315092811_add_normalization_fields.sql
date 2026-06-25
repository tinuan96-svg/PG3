/*
  # Product Normalization System Schema

  1. Modified Tables

    - `products`
      - `weight_value` (numeric) - Extracted numeric weight value (e.g. 5 from 5kg)
      - `weight_unit` (text) - Normalized weight unit (kg, g, ml, l, pcs)
      - `needs_ai_image` (boolean) - Flag for products imported without images

    - `import_logs`
      - `products_cleaned` (integer) - Count of products whose titles were normalized
      - `duplicates_detected` (integer) - Count of duplicate products skipped

    - `brands`
      - `logo_url` (text) - Brand logo URL; placeholder used until admin uploads real logo

  2. Notes
    - weight_value and weight_unit allow consistent filtering/sorting by weight
    - needs_ai_image flags products for admin review and AI image generation
    - products_cleaned tracks the normalization value across syncs
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_value numeric(10, 3),
  ADD COLUMN IF NOT EXISTS weight_unit text,
  ADD COLUMN IF NOT EXISTS needs_ai_image boolean NOT NULL DEFAULT false;

ALTER TABLE import_logs
  ADD COLUMN IF NOT EXISTS products_cleaned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplicates_detected integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE brands ADD COLUMN logo_url text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_needs_ai_image ON products (needs_ai_image) WHERE needs_ai_image = true;
CREATE INDEX IF NOT EXISTS idx_products_weight_unit ON products (weight_unit);
