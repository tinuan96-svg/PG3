/*
  # Drop ambiguous approve_product overload

  ## Problem
  Two approve_product functions exist:
    1. approve_product(p_id uuid)  — created by sync_primary_image migration
    2. approve_product(p_id uuid, p_name text DEFAULT NULL, ...)  — older version

  Both match a call of approve_product(p_id => uuid) because the second function's
  extra parameters all have DEFAULT values. PostgreSQL raises:
    "could not choose the best candidate function"

  ## Fix
  Drop the old multi-parameter overload. The new single-parameter version already
  handles syncing the primary image and setting approval_status/visibility_status.
*/

DROP FUNCTION IF EXISTS approve_product(
  uuid, text, text, text, uuid, text, numeric, numeric,
  text, text, text, boolean, text
);
