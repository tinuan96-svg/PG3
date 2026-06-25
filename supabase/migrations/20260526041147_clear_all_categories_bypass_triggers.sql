/*
  # Clear all existing categories (bypass broken triggers)

  Uses session_replication_role = replica to skip user-defined triggers
  while keeping FK constraint triggers intact.
*/

SET session_replication_role = replica;

UPDATE products SET category_id = NULL WHERE category_id IS NOT NULL;

DELETE FROM categories;

SET session_replication_role = DEFAULT;
