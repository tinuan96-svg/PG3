/*
  # Admin Order Notifications

  ## New Tables

  ### admin_notification_settings
  Stores configurable admin alert preferences for new paid orders.
  - `id` (uuid, primary key) — single row keyed to a fixed UUID
  - `admin_email` (text) — email address to receive order alerts
  - `admin_whatsapp` (text) — WhatsApp/phone number for alerts
  - `push_enabled` (boolean) — OneSignal push to admin users
  - `email_enabled` (boolean) — email alerts
  - `whatsapp_enabled` (boolean) — WhatsApp alerts
  - `updated_at` (timestamptz)

  ### admin_notifications
  Audit log for every notification attempt (push, email, WhatsApp).
  - `id` (uuid, primary key)
  - `order_id` (uuid, FK → orders.id)
  - `type` (text) — 'push' | 'email' | 'whatsapp'
  - `recipient` (text) — email address, phone number, or 'admin_users'
  - `status` (text) — 'sent' | 'failed' | 'skipped'
  - `error_message` (text, nullable)
  - `sent_at` (timestamptz)
  - `response` (jsonb, nullable) — raw provider response

  ## Security
  - RLS enabled on both tables
  - admin_notification_settings: SELECT/UPDATE for admin users only
  - admin_notifications: SELECT/INSERT for admin users; system inserts via service role
  - Unique constraint on (order_id, type) prevents duplicate notifications per order
*/

-- ─── admin_notification_settings ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_notification_settings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email  text NOT NULL DEFAULT '',
  admin_whatsapp text NOT NULL DEFAULT '',
  push_enabled    boolean NOT NULL DEFAULT true,
  email_enabled   boolean NOT NULL DEFAULT true,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- Seed the single settings row with a fixed ID
INSERT INTO admin_notification_settings (id)
VALUES ('00000000-0000-0000-0000-000000000088')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can read notification settings"
  ON admin_notification_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update notification settings"
  ON admin_notification_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ─── admin_notifications ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL,
  type          text NOT NULL CHECK (type IN ('push', 'email', 'whatsapp')),
  recipient     text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message text,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  response      jsonb
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Unique: one notification of each type per order (prevents duplicates on webhook retries)
CREATE UNIQUE INDEX IF NOT EXISTS admin_notifications_order_type_unique
  ON admin_notifications (order_id, type);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS admin_notifications_sent_at_idx
  ON admin_notifications (sent_at DESC);

CREATE INDEX IF NOT EXISTS admin_notifications_order_id_idx
  ON admin_notifications (order_id);

CREATE POLICY "Admins can read admin notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert admin notifications"
  ON admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );
