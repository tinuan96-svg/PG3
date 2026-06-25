/*
  # OneSignal Push Notification System

  ## New Tables

  ### push_subscriptions
  Tracks registered OneSignal player IDs per user and device.
  - `user_id` — references auth.users(id), nullable for anonymous/pre-login registrations
  - `onesignal_player_id` — unique OneSignal subscription ID
  - `device_type` — 'web' | 'android' | 'ios'
  - `platform` — browser or device name (chrome, edge, android, etc.)
  - `last_active` — updated each time device is seen

  ### notification_campaigns
  Logs every admin-sent or auto-sent push campaign for analytics.
  - `segment` — OneSignal segment name or 'user:{uuid}' for direct sends
  - `status` — sent | scheduled | failed | draft
  - `onesignal_notification_id` — ID returned by OneSignal API for analytics
  - `sent_count`, `delivered_count`, `opened_count` — pulled from OneSignal analytics
  - `scheduled_at` — when to deliver for scheduled campaigns
  - `sent_at` — when campaign was dispatched

  ## Modified Tables

  ### communication_preferences
  New push notification preference columns added:
  - `push_order_updates` — order status notifications (default: true)
  - `push_promotions` — marketing/promotional pushes (default: false)
  - `push_flash_deals` — flash deal alerts (default: false)
  - `push_new_products` — new product announcements (default: false)
  - `push_recipes` — recipe suggestions (default: false)

  ## Security
  - RLS enabled on both new tables
  - Users can manage only their own push subscriptions
  - notification_campaigns readable by admins, insertable by authenticated (for auto-notifications)
  - Push preference columns use existing communication_preferences RLS
*/

-- ─── push_subscriptions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  onesignal_player_id   text        NOT NULL,
  device_type           text        NOT NULL DEFAULT 'web'
                                    CHECK (device_type IN ('web', 'android', 'ios')),
  platform              text        NOT NULL DEFAULT 'chrome',
  last_active           timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (onesignal_player_id)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all push subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (is_admin());

-- ─── notification_campaigns ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_campaigns (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                     text        NOT NULL,
  message                   text        NOT NULL,
  image_url                 text        NOT NULL DEFAULT '',
  landing_url               text        NOT NULL DEFAULT '',
  segment                   text        NOT NULL DEFAULT 'All',
  status                    text        NOT NULL DEFAULT 'sent'
                                        CHECK (status IN ('sent', 'scheduled', 'failed', 'draft')),
  onesignal_notification_id text        NOT NULL DEFAULT '',
  sent_count                integer     NOT NULL DEFAULT 0,
  delivered_count           integer     NOT NULL DEFAULT 0,
  opened_count              integer     NOT NULL DEFAULT 0,
  scheduled_at              timestamptz,
  sent_at                   timestamptz,
  created_by                uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_at
  ON notification_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status
  ON notification_campaigns(status);

ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification campaigns"
  ON notification_campaigns FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert notification campaigns"
  ON notification_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update notification campaigns"
  ON notification_campaigns FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow service role to insert campaigns (for automated order notifications)
CREATE POLICY "Service role can insert notification campaigns"
  ON notification_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── Push preference columns on communication_preferences ─────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communication_preferences' AND column_name = 'push_order_updates'
  ) THEN
    ALTER TABLE communication_preferences
      ADD COLUMN push_order_updates  boolean NOT NULL DEFAULT true,
      ADD COLUMN push_promotions     boolean NOT NULL DEFAULT false,
      ADD COLUMN push_flash_deals    boolean NOT NULL DEFAULT false,
      ADD COLUMN push_new_products   boolean NOT NULL DEFAULT false,
      ADD COLUMN push_recipes        boolean NOT NULL DEFAULT false;
  END IF;
END $$;
