/*
  # Add reduce_product_stock RPC and Wallet Config

  1. New RPCs
    - `reduce_product_stock`: Atomic stock reduction after purchase
    - `get_worldpay_wallet_config`: Returns non-sensitive wallet IDs
    - `get_worldpay_client_key`: (Already exists but ensure it's correct)

  2. Table Updates
    - `worldpay_settings`: Add columns for Apple/Google Pay merchant IDs
*/

-- ── 1. Update worldpay_settings table ────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'worldpay_settings' AND column_name = 'apple_pay_merchant_id') THEN
    ALTER TABLE worldpay_settings ADD COLUMN apple_pay_merchant_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'worldpay_settings' AND column_name = 'apple_pay_domain_verification') THEN
    ALTER TABLE worldpay_settings ADD COLUMN apple_pay_domain_verification text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'worldpay_settings' AND column_name = 'google_pay_merchant_id') THEN
    ALTER TABLE worldpay_settings ADD COLUMN google_pay_merchant_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'worldpay_settings' AND column_name = 'google_pay_merchant_name') THEN
    ALTER TABLE worldpay_settings ADD COLUMN google_pay_merchant_name text DEFAULT 'PocketGrocery';
  END IF;
END $$;

-- ── 2. Add reduce_product_stock function ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reduce_product_stock(
  p_product_id uuid,
  p_quantity int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reduce_product_stock(uuid, int) TO authenticated, service_role;

-- ── 3. Add get_worldpay_wallet_config function ────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_worldpay_wallet_config()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'apple_pay_merchant_id', apple_pay_merchant_id,
    'google_pay_merchant_id', google_pay_merchant_id,
    'google_pay_merchant_name', google_pay_merchant_name
  )
  FROM worldpay_settings
  WHERE id = '00000000-0000-0000-0000-000000000099'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_worldpay_wallet_config() TO anon, authenticated;
