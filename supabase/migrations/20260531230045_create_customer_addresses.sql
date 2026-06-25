/*
  # Customer Addresses

  ## Summary
  Creates a `customer_addresses` table for the Saved Addresses feature, allowing
  returning customers to select a pre-saved delivery address at checkout without
  re-entering details.

  ## New Table: customer_addresses
  - `id` — primary key
  - `customer_id` — references auth.users(id), i.e. auth.uid() of the owner
  - `full_name` — recipient name on the delivery label
  - `phone` — contact phone for delivery driver
  - `address_line_1` — street address (required)
  - `address_line_2` — flat/apartment number etc (optional)
  - `city` — town or city (required)
  - `county` — county / region (optional)
  - `postcode` — UK postcode (required)
  - `country` — defaults to 'United Kingdom'
  - `delivery_notes` — free-text delivery instructions (leave at door etc.)
  - `address_type` — 'home' | 'work' | 'other'
  - `is_default` — only one row per customer may be true at a time
  - `created_at`, `updated_at` — timestamps

  ## Security
  - RLS enabled; customers can only read/write their own rows
  - Admins can view all addresses via is_admin()

  ## Default address logic
  A trigger `enforce_single_default_address` ensures that when a row is inserted
  or updated with `is_default = true`, all other rows for that customer are
  automatically set to `is_default = false`, maintaining the one-default invariant.
*/

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_addresses (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text        NOT NULL DEFAULT '',
  phone            text        NOT NULL DEFAULT '',
  address_line_1   text        NOT NULL DEFAULT '',
  address_line_2   text        NOT NULL DEFAULT '',
  city             text        NOT NULL DEFAULT '',
  county           text        NOT NULL DEFAULT '',
  postcode         text        NOT NULL DEFAULT '',
  country          text        NOT NULL DEFAULT 'United Kingdom',
  delivery_notes   text        NOT NULL DEFAULT '',
  address_type     text        NOT NULL DEFAULT 'home'
                               CHECK (address_type IN ('home', 'work', 'other')),
  is_default       boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id
  ON customer_addresses(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_default
  ON customer_addresses(customer_id, is_default)
  WHERE is_default = true;

-- ─── Trigger: enforce one default per customer ────────────────────────────────

CREATE OR REPLACE FUNCTION clear_other_default_addresses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE customer_addresses
    SET is_default = false
    WHERE customer_id = NEW.customer_id
      AND id <> NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_single_default_address ON customer_addresses;
CREATE TRIGGER enforce_single_default_address
  AFTER INSERT OR UPDATE OF is_default ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION clear_other_default_addresses();

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER set_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own addresses"
  ON customer_addresses FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert own addresses"
  ON customer_addresses FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own addresses"
  ON customer_addresses FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can delete own addresses"
  ON customer_addresses FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Admins can view all addresses"
  ON customer_addresses FOR SELECT
  TO authenticated
  USING (is_admin());
