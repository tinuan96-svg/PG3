
/*
  # Fix stock_override column default and zero/negative data

  ## Problem
  - stock_override column defaults to 0, causing all new store products to show
    as "out of stock" since the RPC treats stock_override=0 as no stock
  - 294 existing rows have stock_override <= 0 (249 negative, 45 zero) that
    should fall back to the base products.stock value

  ## Fix
  1. Change column default from 0 to NULL
  2. Update all existing rows with stock_override <= 0 to NULL so they fall
     back to base product stock via COALESCE(stock_override, products.stock)
*/

ALTER TABLE store_products ALTER COLUMN stock_override SET DEFAULT NULL;

UPDATE store_products SET stock_override = NULL WHERE stock_override <= 0;
