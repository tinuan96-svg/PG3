/*
  # Hybrid CentralHub Integration — Schema Extension

  ## What this adds

  Extends the products table with a clear separation between fields that
  CentralHub owns (synced automatically) and fields that PocketGrocery
  admins own (never overwritten by sync).

  ### New CentralHub-owned columns
  - `stock_qty`         — Current stock level synced from CentralHub on every run
  - `centralhub_status` — CentralHub's own active/inactive flag ('active' | 'inactive')
  - `weight_grams`      — Physical weight from CentralHub (nullable, admin can edit)
  - `barcode`           — GTIN/EAN barcode from CentralHub

  ### New admin flag
  - `needs_admin_review` — Set to true when a new product arrives from CentralHub
                           without an image, description or category.
                           Cleared when admin approves the product.

  ### Data migration
  - Existing draft products that are missing image, description, or category
    are flagged as needs_admin_review = true so they surface in the queue.

  ### Index
  - Index on needs_admin_review to quickly count/filter the review queue.
*/

DO $$
BEGIN
  -- stock_qty: live inventory count from CentralHub
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_qty'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_qty integer NOT NULL DEFAULT 0;
  END IF;

  -- centralhub_status: is_active translated to 'active'/'inactive'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'centralhub_status'
  ) THEN
    ALTER TABLE products ADD COLUMN centralhub_status text NOT NULL DEFAULT 'active'
      CHECK (centralhub_status IN ('active', 'inactive'));
  END IF;

  -- weight_grams: physical weight from CentralHub (nullable until provided)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'weight_grams'
  ) THEN
    ALTER TABLE products ADD COLUMN weight_grams numeric(10,2) DEFAULT NULL;
  END IF;

  -- barcode: GTIN / EAN from CentralHub
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'barcode'
  ) THEN
    ALTER TABLE products ADD COLUMN barcode text NOT NULL DEFAULT '';
  END IF;

  -- needs_admin_review: true when a new product arrives needing enrichment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'needs_admin_review'
  ) THEN
    ALTER TABLE products ADD COLUMN needs_admin_review boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Flag existing draft products that are missing essential admin content
UPDATE products
SET needs_admin_review = true
WHERE
  approval_status = 'draft'
  AND (
    (image IS NULL OR image = '')
    OR (category_id IS NULL)
    OR (description IS NULL OR description = '')
  );

-- Index to quickly count/filter the review queue
CREATE INDEX IF NOT EXISTS idx_products_needs_admin_review
  ON products (needs_admin_review)
  WHERE needs_admin_review = true;

-- Index on centralhub_status for storefront queries
CREATE INDEX IF NOT EXISTS idx_products_centralhub_status
  ON products (centralhub_status);
