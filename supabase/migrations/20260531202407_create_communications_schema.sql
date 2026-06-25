/*
  # Communications Schema — Twilio / SendGrid Platform

  ## Summary
  Establishes the unified communication platform for PocketGrocery, supporting
  Twilio SMS, Twilio WhatsApp Business, and Twilio SendGrid Email.

  ## New Tables

  ### communication_templates
  Reusable message templates for Email, SMS and WhatsApp.
  - id, name, channel (email/sms/whatsapp), type (transactional/marketing), subject,
    body_html, body_text, variables (jsonb array of {key, description}), is_active

  ### communication_preferences
  Per-customer opt-in/out settings.
  - user_profile_id (FK user_profiles), email_transactional, email_marketing,
    sms_transactional, sms_marketing, whatsapp_transactional, whatsapp_marketing

  ### consent_records
  Immutable audit trail of every consent change.
  - user_profile_id, channel, consent_type (marketing/transactional), granted (bool),
    source (checkout/account/admin/import), ip_address, user_agent, consented_at

  ### communication_campaigns
  Marketing campaign definitions.
  - id, name, channel, template_id, subject, status (draft/scheduled/sending/sent/paused/cancelled),
    audience_type (all/segment/manual), segment_type, scheduled_at, sent_at,
    recipient_count, sent_count, failed_count, metadata (jsonb)

  ### campaign_recipients
  Resolved list of recipients per campaign.
  - campaign_id, user_profile_id, email, phone, status, sent_at, error_message

  ### communication_logs
  Full audit log of every message sent.
  - id, campaign_id, user_profile_id, channel, message_type (transactional/marketing),
    template_id, recipient_email, recipient_phone, subject, body_preview,
    status (queued/sent/delivered/failed/bounced), provider (sendgrid/twilio_sms/twilio_whatsapp),
    provider_message_id, provider_response (jsonb), error_message,
    retry_count, next_retry_at, sent_at, delivered_at, created_at

  ## Security
  - RLS enabled on all tables
  - Customers can read/update their own preferences and consent records
  - Admins (role='admin') can read/write all rows
  - communication_logs: admins full access, customers read own logs
*/

-- ── communication_templates ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS communication_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  type text NOT NULL DEFAULT 'transactional' CHECK (type IN ('transactional', 'marketing')),
  subject text,
  body_html text,
  body_text text NOT NULL DEFAULT '',
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
  ON communication_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert templates"
  ON communication_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update templates"
  ON communication_templates FOR UPDATE
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

CREATE POLICY "Admins can delete templates"
  ON communication_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ── communication_preferences ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS communication_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email_transactional boolean NOT NULL DEFAULT true,
  email_marketing boolean NOT NULL DEFAULT false,
  sms_transactional boolean NOT NULL DEFAULT true,
  sms_marketing boolean NOT NULL DEFAULT false,
  whatsapp_transactional boolean NOT NULL DEFAULT false,
  whatsapp_marketing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_comm_prefs_user_profile_id ON communication_preferences(user_profile_id);

ALTER TABLE communication_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON communication_preferences FOR SELECT
  TO authenticated
  USING (
    user_profile_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own preferences"
  ON communication_preferences FOR INSERT
  TO authenticated
  WITH CHECK (
    user_profile_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own preferences"
  ON communication_preferences FOR UPDATE
  TO authenticated
  USING (
    user_profile_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    user_profile_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ── consent_records ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  consent_type text NOT NULL CHECK (consent_type IN ('marketing', 'transactional')),
  granted boolean NOT NULL,
  source text NOT NULL DEFAULT 'account' CHECK (source IN ('checkout', 'account', 'admin', 'import', 'api')),
  ip_address text,
  user_agent text,
  consented_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user_profile_id ON consent_records(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_channel ON consent_records(channel);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own consent records"
  ON consent_records FOR SELECT
  TO authenticated
  USING (
    user_profile_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own consent records"
  ON consent_records FOR INSERT
  TO authenticated
  WITH CHECK (
    user_profile_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ── communication_campaigns ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS communication_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  template_id uuid REFERENCES communication_templates(id) ON DELETE SET NULL,
  subject text,
  body_override text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  audience_type text NOT NULL DEFAULT 'all' CHECK (audience_type IN ('all', 'segment', 'manual')),
  segment_type text CHECK (segment_type IN ('new_customers', 'returning_customers', 'vip', 'inactive', 'high_spenders', 'recent_purchasers')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON communication_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_channel ON communication_campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_campaigns_template_id ON communication_campaigns(template_id);

ALTER TABLE communication_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view campaigns"
  ON communication_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert campaigns"
  ON communication_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update campaigns"
  ON communication_campaigns FOR UPDATE
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

CREATE POLICY "Admins can delete campaigns"
  ON communication_campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ── campaign_recipients ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES communication_campaigns(id) ON DELETE CASCADE,
  user_profile_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_user_profile_id ON campaign_recipients(user_profile_id);

ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign recipients"
  ON campaign_recipients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert campaign recipients"
  ON campaign_recipients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update campaign recipients"
  ON campaign_recipients FOR UPDATE
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

-- ── communication_logs ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES communication_campaigns(id) ON DELETE SET NULL,
  user_profile_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  message_type text NOT NULL DEFAULT 'transactional' CHECK (message_type IN ('transactional', 'marketing')),
  template_id uuid REFERENCES communication_templates(id) ON DELETE SET NULL,
  template_name text,
  recipient_email text,
  recipient_phone text,
  subject text,
  body_preview text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'bounced', 'unsubscribed')),
  provider text NOT NULL CHECK (provider IN ('sendgrid', 'twilio_sms', 'twilio_whatsapp')),
  provider_message_id text,
  provider_response jsonb,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  order_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_logs_user_profile_id ON communication_logs(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_channel ON communication_logs(channel);
CREATE INDEX IF NOT EXISTS idx_comm_logs_status ON communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_comm_logs_created_at ON communication_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_logs_campaign_id ON communication_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_order_id ON communication_logs(order_id);

ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON communication_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert logs"
  ON communication_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can update logs"
  ON communication_logs FOR UPDATE
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

-- Allow service role (bypasses RLS) to insert logs from edge functions
-- The edge function uses SUPABASE_SERVICE_ROLE_KEY so no policy needed for service role

-- ── admin_alert_settings ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_email text,
  alert_phone text,
  alert_whatsapp text,
  alert_on_payment_failure boolean NOT NULL DEFAULT true,
  alert_on_sync_failure boolean NOT NULL DEFAULT true,
  alert_on_order_error boolean NOT NULL DEFAULT true,
  alert_on_webhook_failure boolean NOT NULL DEFAULT true,
  alert_on_low_stock boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alert settings"
  ON admin_alert_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert alert settings"
  ON admin_alert_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update alert settings"
  ON admin_alert_settings FOR UPDATE
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

-- ── Seed default admin alert settings row ─────────────────────────────────────

INSERT INTO admin_alert_settings (id)
VALUES ('00000000-0000-0000-0000-000000000088')
ON CONFLICT (id) DO NOTHING;

-- ── Seed default templates ────────────────────────────────────────────────────

INSERT INTO communication_templates (name, channel, type, subject, body_html, body_text, variables) VALUES
(
  'Order Confirmed',
  'email',
  'transactional',
  'Your PocketGrocery order #{{order_number}} is confirmed',
  '<h2>Order Confirmed!</h2><p>Hi {{customer_name}},</p><p>Thank you for your order. We have received your order #{{order_number}} and it is now being processed.</p><p><strong>Total:</strong> £{{order_total}}</p><p>We will notify you when your order is on its way.</p><p>The PocketGrocery Team</p>',
  'Hi {{customer_name}}, your order #{{order_number}} has been confirmed. Total: £{{order_total}}. We will notify you when it ships.',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"},{"key":"order_total","description":"Order total in GBP"}]'
),
(
  'Order Shipped',
  'email',
  'transactional',
  'Your PocketGrocery order #{{order_number}} is on its way',
  '<h2>Your Order is on its Way!</h2><p>Hi {{customer_name}},</p><p>Great news! Your order #{{order_number}} has been dispatched and is heading your way.</p><p>Estimated delivery: {{estimated_delivery}}</p><p>The PocketGrocery Team</p>',
  'Hi {{customer_name}}, your order #{{order_number}} has been dispatched. Estimated delivery: {{estimated_delivery}}.',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"},{"key":"estimated_delivery","description":"Estimated delivery date"}]'
),
(
  'Order Delivered',
  'email',
  'transactional',
  'Your PocketGrocery order #{{order_number}} has been delivered',
  '<h2>Order Delivered!</h2><p>Hi {{customer_name}},</p><p>Your order #{{order_number}} has been delivered. We hope you enjoy your groceries!</p><p>The PocketGrocery Team</p>',
  'Hi {{customer_name}}, your order #{{order_number}} has been delivered. Enjoy your groceries!',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"}]'
),
(
  'Order Confirmed',
  'sms',
  'transactional',
  NULL,
  NULL,
  'PocketGrocery: Hi {{customer_name}}, your order #{{order_number}} is confirmed. Total: £{{order_total}}. Reply STOP to opt out.',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"},{"key":"order_total","description":"Order total"}]'
),
(
  'Out For Delivery',
  'sms',
  'transactional',
  NULL,
  NULL,
  'PocketGrocery: Hi {{customer_name}}, your order #{{order_number}} is out for delivery today! Reply STOP to opt out.',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"}]'
),
(
  'Order Confirmed',
  'whatsapp',
  'transactional',
  NULL,
  NULL,
  'Hello {{customer_name}}! 🛒 Your PocketGrocery order *#{{order_number}}* has been confirmed.\n\nTotal: *£{{order_total}}*\n\nWe will send you an update when your order is dispatched.',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"},{"key":"order_total","description":"Order total"}]'
),
(
  'Order Delivered',
  'whatsapp',
  'transactional',
  NULL,
  NULL,
  'Hi {{customer_name}}! ✅ Your PocketGrocery order *#{{order_number}}* has been delivered. Enjoy your groceries! 🥗',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"}]'
)
ON CONFLICT DO NOTHING;
