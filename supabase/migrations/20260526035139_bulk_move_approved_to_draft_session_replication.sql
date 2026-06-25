/*
  # Bulk move all approved products to draft

  Uses session_replication_role to bypass user-defined triggers while keeping
  system (FK constraint) triggers active.
*/

SET session_replication_role = replica;

UPDATE products
SET is_active = false, approval_status = 'draft'
WHERE approval_status = 'approved'
  AND COALESCE(is_deleted, false) = false;

SET session_replication_role = DEFAULT;
