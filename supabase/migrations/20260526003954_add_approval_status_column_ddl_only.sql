/*
  # Add approval_status column to products

  Pure DDL — no row updates. This adds the column and index only.
  The backfill UPDATE is done separately with the broken trigger disabled.

  New columns:
  - approval_status (text, default 'draft') — 'draft' | 'approved' | 'rejected'
  - approved_at (timestamptz)
  - approved_by (uuid)

  Index on (approval_status, is_active) for fast storefront queries.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

CREATE INDEX IF NOT EXISTS idx_products_approval_active
  ON products (approval_status, is_active)
  WHERE is_deleted = false;
