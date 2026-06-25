/*
  # Worldpay Payment Tables

  1. New Tables
    - `worldpay_settings` — Singleton row storing production Worldpay credentials
      - `service_key`, `entity_id`, `client_key`, `webhook_secret` — credential fields
      - `last_transaction_at`, `last_webhook_at` — audit timestamps

    - `payment_transactions` — One row per authorization attempt linked to an order
      - `order_id` (uuid FK → orders)
      - `transaction_id` (text) — Worldpay paymentId
      - `amount` (integer) — Amount in pence (GBP)
      - `status` — authorized | paid | failed | refunded | partially_refunded
      - `card_last_four`, `card_scheme`, `authorization_code`, `worldpay_response` — audit fields

    - `payment_refunds` — One row per refund issued via Worldpay API
      - `order_id` (uuid), `transaction_id`, `refund_id`, `amount` (pence), `status`, `reason`

  2. Security
    - RLS enabled on all three tables
    - Admins (role = 'admin' in user_profiles) can read/write all three tables
    - Service role key (edge functions) bypasses RLS
*/

-- ── worldpay_settings ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS worldpay_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key text NOT NULL DEFAULT '',
  entity_id text NOT NULL DEFAULT '',
  client_key text NOT NULL DEFAULT '',
  webhook_secret text NOT NULL DEFAULT '',
  test_mode boolean NOT NULL DEFAULT false,
  last_transaction_at timestamptz,
  last_webhook_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE worldpay_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read worldpay_settings"
  ON worldpay_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert worldpay_settings"
  ON worldpay_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update worldpay_settings"
  ON worldpay_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Ensure singleton row exists
INSERT INTO worldpay_settings (id)
VALUES ('00000000-0000-0000-0000-000000000099')
ON CONFLICT (id) DO NOTHING;

-- ── payment_transactions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  transaction_id text NOT NULL DEFAULT '',
  payment_method text NOT NULL DEFAULT 'card',
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'authorized',
  authorization_code text,
  card_last_four text,
  card_scheme text,
  worldpay_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read payment_transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert payment_transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment_transactions"
  ON payment_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ── payment_refunds ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  transaction_id text NOT NULL DEFAULT '',
  refund_id text NOT NULL DEFAULT '',
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'pending',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_id ON payment_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_transaction_id ON payment_refunds(transaction_id);

ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read payment_refunds"
  ON payment_refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert payment_refunds"
  ON payment_refunds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment_refunds"
  ON payment_refunds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
