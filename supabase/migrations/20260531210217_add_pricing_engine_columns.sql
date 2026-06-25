/*
  # Pricing Engine — Add cost_price, markup_percentage, selling_price, profit_amount

  ## Summary
  Implements the full PocketGrocery pricing engine. CentralHub prices become
  cost prices. Selling prices are always calculated from cost × (1 + markup%).

  ## New Columns on products
  - cost_price (numeric 10,2): Supplier cost from CentralHub. Never shown to customers.
  - markup_percentage (numeric 6,2): Per-product markup override. Null = use global rule.
  - selling_price (numeric 10,2): Computed storefront price = cost_price × (1 + markup/100).
  - profit_amount (numeric 10,2): selling_price - cost_price.

  ## New Columns on order_items
  - cost_price_at_order (numeric 10,2): Cost snapshot at time of purchase.
  - selling_price_at_order (numeric 10,2): Sell price snapshot at time of purchase.
  - profit_at_order (numeric 10,2): Profit snapshot at time of purchase.

  ## Database Function
  - recalculate_product_pricing(p_product_id uuid, p_global_markup numeric):
    Recomputes selling_price and profit_amount for one product.
  - recalculate_all_pricing(p_global_markup numeric):
    Batch recalculates every product with a cost_price > 0.

  ## Data Migration
  - Populates cost_price from existing price column for CentralHub-sourced products.
  - Runs initial recalculation using 3% global markup.

  ## Default Global Pricing Rule
  - Inserts a 3% global rule into pricing_rules if none exists.
*/

-- ── Add columns to products ───────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price') THEN
    ALTER TABLE products ADD COLUMN cost_price numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'markup_percentage') THEN
    ALTER TABLE products ADD COLUMN markup_percentage numeric(6,2) DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'selling_price') THEN
    ALTER TABLE products ADD COLUMN selling_price numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'profit_amount') THEN
    ALTER TABLE products ADD COLUMN profit_amount numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- ── Add snapshot columns to order_items ──────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'cost_price_at_order') THEN
    ALTER TABLE order_items ADD COLUMN cost_price_at_order numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'selling_price_at_order') THEN
    ALTER TABLE order_items ADD COLUMN selling_price_at_order numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'profit_at_order') THEN
    ALTER TABLE order_items ADD COLUMN profit_at_order numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- ── recalculate_product_pricing ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalculate_product_pricing(
  p_product_id uuid,
  p_global_markup numeric DEFAULT 3
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost_price     numeric;
  v_markup         numeric;
  v_selling_price  numeric;
  v_profit         numeric;
BEGIN
  SELECT cost_price, markup_percentage
  INTO v_cost_price, v_markup
  FROM products
  WHERE id = p_product_id;

  IF v_cost_price IS NULL OR v_cost_price = 0 THEN
    RETURN;
  END IF;

  -- Use per-product markup if set, otherwise fall back to global
  v_markup := COALESCE(v_markup, p_global_markup);

  v_selling_price := ROUND(v_cost_price * (1 + v_markup / 100), 2);
  v_profit := ROUND(v_selling_price - v_cost_price, 2);

  UPDATE products
  SET
    selling_price = v_selling_price,
    profit_amount = v_profit,
    -- Keep price column in sync for backwards compatibility with existing storefront queries
    price = v_selling_price,
    updated_at = now()
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION recalculate_product_pricing(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_product_pricing(uuid, numeric) TO service_role;

-- ── recalculate_all_pricing ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalculate_all_pricing(
  p_global_markup numeric DEFAULT 3
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_product RECORD;
  v_markup numeric;
  v_selling_price numeric;
  v_profit numeric;
BEGIN
  FOR v_product IN
    SELECT id, cost_price, markup_percentage
    FROM products
    WHERE cost_price IS NOT NULL AND cost_price > 0
  LOOP
    v_markup := COALESCE(v_product.markup_percentage, p_global_markup);
    v_selling_price := ROUND(v_product.cost_price * (1 + v_markup / 100), 2);
    v_profit := ROUND(v_selling_price - v_product.cost_price, 2);

    UPDATE products
    SET
      selling_price = v_selling_price,
      profit_amount = v_profit,
      price = v_selling_price,
      updated_at = now()
    WHERE id = v_product.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION recalculate_all_pricing(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_pricing(numeric) TO service_role;

-- ── Populate cost_price from existing price for CentralHub products ───────────

UPDATE products
SET cost_price = price
WHERE (source_type = 'centralhub' OR source_product_id IS NOT NULL)
  AND price > 0
  AND (cost_price IS NULL OR cost_price = 0);

-- ── Initial recalculation with 3% global markup ───────────────────────────────

SELECT recalculate_all_pricing(3);

-- ── Ensure default 3% global pricing rule exists ─────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules
    WHERE rule_type = 'global' AND is_active = true
  ) THEN
    INSERT INTO pricing_rules (rule_type, target_id, target_name, markup_percent, is_active)
    VALUES ('global', NULL, NULL, 3, true);
  END IF;
END $$;

-- ── Index for pricing queries ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_cost_price ON products(cost_price) WHERE cost_price > 0;
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON products(selling_price) WHERE selling_price > 0;
