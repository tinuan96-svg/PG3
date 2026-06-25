
/*
  # Fix negative and zero stock_override values

  ## Problem
  294 store_products rows have stock_override <= 0:
    - 249 rows with negative values (down to -5) — caused by supplier sync drift
    - 45 rows with stock_override = 0 — these products have positive base stock

  Since the RPC uses COALESCE(sp.stock_override, p.stock) > 0 to compute in_stock,
  any non-NULL stock_override <= 0 overrides the base product stock and forces the
  product to show as "Out of Stock" on the storefront.

  ## Fix
  Set all stock_override values <= 0 to NULL so those store products fall back to
  the base products.stock value. This immediately restores availability for the
  affected products.
*/

UPDATE store_products
SET stock_override = NULL
WHERE stock_override <= 0;
