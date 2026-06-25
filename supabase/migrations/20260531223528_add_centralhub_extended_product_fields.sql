/*
  # Add CentralHub Extended Product Fields

  ## Summary
  Adds four new columns to the `products` table to support the full CentralHub → PocketGrocery
  sync field mapping.

  ## New Columns
  - `centralhub_product_id` (text): The original product ID from CentralHub (separate from
    `source_product_id` which holds the same value; this provides a stable reference).
  - `unit` (text): Unit of measure from CentralHub (e.g., "500g", "1kg", "6 pack").
  - `warehouse_location` (text): Warehouse bin/location code from CentralHub.
  - `product_type` (text): Product type from CentralHub — "simple", "variable", or "bundle".
    Defaults to "simple" for all existing rows.

  ## Notes
  - All columns use `ADD COLUMN IF NOT EXISTS` to be idempotent.
  - Safe defaults ensure no data loss on existing rows.
  - No RLS changes needed — these columns inherit the existing products table policies.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS centralhub_product_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit                   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS warehouse_location     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS product_type           TEXT NOT NULL DEFAULT 'simple';

CREATE INDEX IF NOT EXISTS idx_products_centralhub_product_id ON products(centralhub_product_id)
  WHERE centralhub_product_id != '';

CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
