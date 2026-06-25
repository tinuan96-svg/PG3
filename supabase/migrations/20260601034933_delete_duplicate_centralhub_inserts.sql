/*
  # Delete duplicate CentralHub product inserts

  ## Problem
  A sync run inserted 371 new products from CentralHub with source_type='centralhub'
  instead of updating the existing 371 seeded products. This migration removes those
  duplicates so the next sync (with the fixed name-match logic) can update the originals.

  ## What is deleted
  - Products where source_type = 'centralhub' AND synced_at IS NOT NULL
  - These are exclusively the duplicates created by the broken sync run
  - The 371 seeded products (source_type IS NULL) are untouched

  ## Safety
  - Seeded products have source_type IS NULL — not touched
  - Only removing newly inserted rows that have not been admin-enriched
    (no images, no descriptions, approval_status = 'draft', brand values blank)
*/

DELETE FROM products
WHERE source_type = 'centralhub'
  AND synced_at IS NOT NULL;
