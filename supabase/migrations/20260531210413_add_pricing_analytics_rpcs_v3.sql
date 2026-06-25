/*
  # Pricing Analytics RPCs — corrected (no brand_id on products)

  Products table has no direct brand_id column, so profit report
  joins only on category_id.
*/

-- Update global rule to 3%
UPDATE pricing_rules SET markup_pct = 3, label = 'Default global markup (3%)', updated_at = now() WHERE rule_type = 'global';

-- Re-run pricing recalculation at 3%
SELECT recalculate_all_pricing(3);

-- ── Admin pricing analytics RPC ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_pricing_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_global_markup numeric;
BEGIN
  SELECT COALESCE(markup_pct, 3)
  INTO v_global_markup
  FROM pricing_rules
  WHERE rule_type = 'global' AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  v_global_markup := COALESCE(v_global_markup, 3);

  SELECT jsonb_build_object(
    'total_products',         COUNT(*),
    'priced_products',        COUNT(*) FILTER (WHERE selling_price > 0),
    'avg_cost_price',         ROUND(AVG(cost_price) FILTER (WHERE cost_price > 0), 2),
    'avg_selling_price',      ROUND(AVG(selling_price) FILTER (WHERE selling_price > 0), 2),
    'avg_markup_pct',         ROUND(AVG(COALESCE(markup_percentage, v_global_markup)) FILTER (WHERE cost_price > 0), 2),
    'total_cost_value',       ROUND(SUM(cost_price * GREATEST(COALESCE(stock_qty, 0), 0)) FILTER (WHERE cost_price > 0), 2),
    'total_selling_value',    ROUND(SUM(selling_price * GREATEST(COALESCE(stock_qty, 0), 0)) FILTER (WHERE selling_price > 0), 2),
    'total_expected_profit',  ROUND(SUM(profit_amount * GREATEST(COALESCE(stock_qty, 0), 0)) FILTER (WHERE profit_amount IS NOT NULL AND profit_amount > 0), 2),
    'products_with_override', COUNT(*) FILTER (WHERE markup_percentage IS NOT NULL),
    'zero_cost_products',     COUNT(*) FILTER (WHERE cost_price = 0 OR cost_price IS NULL)
  )
  INTO v_result
  FROM products
  WHERE approval_status IS DISTINCT FROM 'deleted';

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pricing_analytics() TO authenticated;

-- ── Top/bottom profit products ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_top_profit_products(p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, name text, cost_price numeric, selling_price numeric, profit_amount numeric, markup_percentage numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, cost_price, selling_price, profit_amount, markup_percentage
  FROM products WHERE selling_price > 0 AND cost_price > 0 AND (approval_status IS DISTINCT FROM 'deleted')
  ORDER BY profit_amount DESC NULLS LAST LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION get_top_profit_products(integer) TO authenticated;

CREATE OR REPLACE FUNCTION get_bottom_profit_products(p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, name text, cost_price numeric, selling_price numeric, profit_amount numeric, markup_percentage numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, cost_price, selling_price, profit_amount, markup_percentage
  FROM products WHERE selling_price > 0 AND cost_price > 0 AND (approval_status IS DISTINCT FROM 'deleted')
  ORDER BY profit_amount ASC NULLS LAST LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION get_bottom_profit_products(integer) TO authenticated;

-- ── Global markup getter ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_global_markup()
RETURNS numeric
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT markup_pct FROM pricing_rules WHERE rule_type = 'global' AND is_active = true ORDER BY created_at DESC LIMIT 1), 3);
$$;
GRANT EXECUTE ON FUNCTION get_global_markup() TO authenticated;
GRANT EXECUTE ON FUNCTION get_global_markup() TO anon;

-- ── Profit report RPC ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_profit_report(
  p_category_id uuid DEFAULT NULL,
  p_date_from   timestamptz DEFAULT NULL,
  p_date_to     timestamptz DEFAULT NULL
)
RETURNS TABLE(
  product_id    uuid,
  product_name  text,
  category_name text,
  cost_price    numeric,
  selling_price numeric,
  profit_amount numeric,
  markup_pct    numeric,
  margin_pct    numeric,
  stock_qty     integer
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id,
    p.name,
    c.name AS category_name,
    p.cost_price,
    p.selling_price,
    p.profit_amount,
    ROUND(CASE WHEN p.cost_price > 0 THEN ((p.selling_price - p.cost_price) / p.cost_price) * 100 ELSE 0 END, 2),
    ROUND(CASE WHEN p.selling_price > 0 THEN ((p.selling_price - p.cost_price) / p.selling_price) * 100 ELSE 0 END, 2),
    COALESCE(p.stock_qty, 0)
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.cost_price > 0
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p.approval_status IS DISTINCT FROM 'deleted')
  ORDER BY p.profit_amount DESC NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION get_profit_report(uuid, timestamptz, timestamptz) TO authenticated;
