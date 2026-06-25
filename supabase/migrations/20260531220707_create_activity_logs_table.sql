
/*
  # Create activity_logs table

  ## Purpose
  Tracks all admin actions across the PocketGrocery platform for the
  Operations Centre dashboard activity feed.

  ## New Table: activity_logs
  - `id` - UUID primary key
  - `action_type` - Machine-readable event type (e.g. product_approved, banner_created)
  - `description` - Human-readable description shown in the feed
  - `admin_user_id` - FK to user_profiles (nullable, allows system events)
  - `admin_name` - Denormalised display name for fast reads
  - `entity_type` - The type of record affected (product, order, banner, etc.)
  - `entity_id` - UUID or identifier of the affected record
  - `metadata` - Optional JSONB for extra context
  - `created_at` - Timestamp

  ## Security
  - RLS enabled
  - Admins can SELECT all rows
  - Only service role can INSERT (via edge functions / triggers)
  - No UPDATE or DELETE allowed
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type   text        NOT NULL DEFAULT '',
  description   text        NOT NULL DEFAULT '',
  admin_user_id uuid        REFERENCES user_profiles(id) ON DELETE SET NULL,
  admin_name    text        NOT NULL DEFAULT '',
  entity_type   text        NOT NULL DEFAULT '',
  entity_id     text        NOT NULL DEFAULT '',
  metadata      jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_user_id ON activity_logs(admin_user_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );
