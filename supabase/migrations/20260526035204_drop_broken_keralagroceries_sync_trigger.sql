/*
  # Drop broken keralagroceries sync trigger

  The trigger trg_sync_keralagroceries_products calls sync_keralagroceries_row()
  which references a column "product_display_name" that does not exist in the
  keralagroceries table, causing all product UPDATE operations to fail.

  Dropping the trigger and its function so product updates work correctly.
*/

DROP TRIGGER IF EXISTS trg_sync_keralagroceries_products ON products;
DROP FUNCTION IF EXISTS sync_keralagroceries_products_trigger() CASCADE;
DROP FUNCTION IF EXISTS sync_keralagroceries_row(uuid) CASCADE;
