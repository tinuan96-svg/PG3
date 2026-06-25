/*
  # Worldpay Payment Integration — Tables and Order Columns

  ## Summary
  Creates the payment infrastructure for direct Worldpay API integration.
  Adds customer contact columns to orders for guest checkout.

  ## New Tables

  ### payment_transactions
  Records every payment authorization attempt with Worldpay.
  - `id` — uuid pk
  - `order_id` — fk to orders
  - `transaction_id` — Worldpay transaction/authorization ID
  - `payment_method` — card scheme: visa/mastercard/amex/maestro
  - `amount` — integer pence (e.g. 1999 = £19.99)
  - `currency` — always GBP
  - `status` — authorized/paid/failed/refunded/partially_refunded
  - `authorization_code` — Worldpay auth code
  - `card_last_four` — last 4 digits for display
  - `card_scheme` — Visa/Mastercard/Amex/Maestro
  - `worldpay_response` — full API response JSON
  - `created_at`

  ### payment_refunds
  Records each refund issued via Worldpay.
  - `id` — uuid pk
  - `order_id` — fk to orders
  - `transaction_id` — original Worldpay authorization ID
  - `refund_id` — Worldpay refund ID
  - `amount` — integer pence
  - `status` — pending/completed/failed
  - `reason` — optional reason text
  - `created_at`

  ### worldpay_settings
  Admin-managed Worldpay credentials and status tracking.
  - credentials: merchant_code, client_key, service_key, entity_id, webhook_secret
  - `is_active` — whether integration is live
  - `last_transaction_at`, `last_webhook_at` — for health display

  ### worldpay_webhook_events
  Audit log of every incoming Worldpay webhook.

  ## Orders Table Updates
  Adds customer contact fields needed for guest checkout:
  - customer_name, customer_email, customer_phone
  - delivery_address, delivery_city, delivery_postcode
  - company_name (optional)

  ## Security
  - RLS enabled on all new tables
  - payment_transactions: admin read, service_role write
  - payment_refunds: admin read, service_role write
  - worldpay_settings: admin read/write only
  - worldpay_webhook_events: admin read, service_role write
*/

-- ─── payment_transactions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id    text NOT NULL,
  payment_method    text NOT NULL DEFAULT 'card',
  amount            integer NOT NULL,
  currency          text NOT NULL DEFAULT 'GBP',
  status            text NOT NULL DEFAULT 'pending',
  authorization_code text,
  card_last_four    text,
  card_scheme       text,
  worldpay_response jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions (transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions (status);

CREATE POLICY "Admins can view payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage payment transactions"
  ON payment_transactions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update payment transactions"
  ON payment_transactions FOR UPDATE
  TO service_role
  USING (true) WITH CHECK (true);

-- ─── payment_refunds ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_refunds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id  text NOT NULL,
  refund_id       text,
  amount          integer NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_id ON payment_refunds (order_id);

CREATE POLICY "Admins can view payment refunds"
  ON payment_refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage payment refunds"
  ON payment_refunds FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update payment refunds"
  ON payment_refunds FOR UPDATE
  TO service_role
  USING (true) WITH CHECK (true);

-- ─── worldpay_settings ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS worldpay_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_code         text NOT NULL DEFAULT '',
  client_key            text NOT NULL DEFAULT '',
  service_key           text NOT NULL DEFAULT '',
  entity_id             text NOT NULL DEFAULT '',
  webhook_secret        text NOT NULL DEFAULT '',
  is_active             boolean NOT NULL DEFAULT false,
  last_transaction_at   timestamptz,
  last_webhook_at       timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE worldpay_settings ENABLE ROW LEVEL SECURITY;

-- Seed a single settings row
INSERT INTO worldpay_settings (id)
VALUES ('00000000-0000-0000-0000-000000000099')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can view Worldpay settings"
  ON worldpay_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update Worldpay settings"
  ON worldpay_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can read Worldpay settings"
  ON worldpay_settings FOR SELECT
  TO service_role
  USING (true);

-- ─── worldpay_webhook_events ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS worldpay_webhook_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       text,
  transaction_id   text,
  order_number     text,
  payload          jsonb,
  signature_valid  boolean NOT NULL DEFAULT false,
  processed        boolean NOT NULL DEFAULT false,
  error_message    text,
  received_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE worldpay_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_worldpay_webhook_events_received_at ON worldpay_webhook_events (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_worldpay_webhook_events_transaction_id ON worldpay_webhook_events (transaction_id);

CREATE POLICY "Admins can view Worldpay webhook events"
  ON worldpay_webhook_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage Worldpay webhook events"
  ON worldpay_webhook_events FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update Worldpay webhook events"
  ON worldpay_webhook_events FOR UPDATE
  TO service_role
  USING (true) WITH CHECK (true);

-- ─── Orders: add customer contact columns for guest checkout ──────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_email text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_phone text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_address text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_city'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_city text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_postcode'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_postcode text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN company_name text;
  END IF;
END $$;
