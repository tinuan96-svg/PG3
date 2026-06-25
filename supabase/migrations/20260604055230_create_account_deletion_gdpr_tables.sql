/*
  # Account Deletion Requests & Data Privacy

  ## New Tables
  - `account_deletion_requests` — tracks user-initiated account deletion requests
    - Stores reason, status, requested_at, processed_at
    - Allows admin to process (anonymise + delete user data)
    - 30-day grace period before hard deletion
  - `data_privacy_logs` — GDPR audit trail: what data was exported or deleted, when, by whom

  ## Security
  - RLS: users can only see/insert their own deletion requests
  - Admin can read and update all deletion requests
*/

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason        text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','cancelled')),
  requested_at  timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  grace_end_at  timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  admin_notes   text,
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id   ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status    ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_grace_end ON account_deletion_requests(grace_end_at);

ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion request"
  ON account_deletion_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own deletion request"
  ON account_deletion_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel own pending deletion request"
  ON account_deletion_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

CREATE POLICY "Admin can read all deletion requests"
  ON account_deletion_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update deletion requests"
  ON account_deletion_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- GDPR data privacy audit log
CREATE TABLE IF NOT EXISTS data_privacy_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL CHECK (action IN ('data_export','data_deletion','consent_given','consent_withdrawn','account_deleted')),
  details     jsonb NOT NULL DEFAULT '{}',
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_privacy_logs_user_id   ON data_privacy_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_logs_action    ON data_privacy_logs(action);
CREATE INDEX IF NOT EXISTS idx_privacy_logs_created   ON data_privacy_logs(created_at);

ALTER TABLE data_privacy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own privacy logs"
  ON data_privacy_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert privacy logs"
  ON data_privacy_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can read all privacy logs"
  ON data_privacy_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- RPC: request account deletion (upsert with grace period)
CREATE OR REPLACE FUNCTION request_account_deletion(p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  INSERT INTO account_deletion_requests (user_id, reason)
  VALUES (auth.uid(), p_reason)
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'pending',
        reason = COALESCE(EXCLUDED.reason, account_deletion_requests.reason),
        requested_at = now(),
        grace_end_at = now() + interval '30 days',
        processed_at = NULL
  RETURNING id INTO v_id;

  INSERT INTO data_privacy_logs (user_id, action, details, performed_by)
  VALUES (auth.uid(), 'data_deletion', jsonb_build_object('request_id', v_id, 'reason', p_reason), auth.uid());

  RETURN jsonb_build_object('success', true, 'request_id', v_id, 'grace_end_at', (now() + interval '30 days')::text);
END;
$$;

GRANT EXECUTE ON FUNCTION request_account_deletion(text) TO authenticated;

-- RPC: cancel pending deletion request
CREATE OR REPLACE FUNCTION cancel_account_deletion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  UPDATE account_deletion_requests
  SET status = 'cancelled', processed_at = now()
  WHERE user_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No pending deletion request found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_account_deletion() TO authenticated;
