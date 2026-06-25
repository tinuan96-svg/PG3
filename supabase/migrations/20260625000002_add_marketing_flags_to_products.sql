/*
  # Add marketing and performance flags to products

  Enables advanced filtering for Offers, Best Sellers, and New Arrivals.
*/

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_bestseller boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new_arrival boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sold_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating decimal(3,2) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_products_marketing_flags ON products(is_bestseller, is_deal, is_new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_sold_count ON products(sold_count DESC);

-- Update is_deal based on existing prices if not set
UPDATE products
SET is_deal = true
WHERE compare_price > price AND is_deal = false;
