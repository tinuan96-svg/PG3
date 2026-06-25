/*
  # Move pg_net Extension to Extensions Schema

  1. Schema Changes
    - Create `extensions` schema if it doesn't exist
    - Drop pg_net from public schema
    - Recreate pg_net in extensions schema

  2. Security Notes
    - Moving extensions out of public schema prevents potential conflicts
    - Extensions in dedicated schema are easier to manage and secure
*/

CREATE SCHEMA IF NOT EXISTS extensions;

DROP EXTENSION IF EXISTS pg_net;

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;