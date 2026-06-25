/*
  # Fix Function Search Path Security

  1. Security Changes
    - Recreate `create_store_product_drafts` function with immutable search_path
    - Set search_path to empty string to prevent search_path hijacking
    - Use fully qualified table names (public.store_products)

  2. Notes
    - This prevents potential security vulnerabilities from mutable search_path
    - Function retains SECURITY DEFINER but with safer search_path configuration
*/

CREATE OR REPLACE FUNCTION public.create_store_product_drafts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  first_image text;
BEGIN
  IF NEW.images IS NOT NULL AND jsonb_array_length(NEW.images) > 0 THEN
    first_image := NEW.images->>0;
  ELSE
    first_image := NULL;
  END IF;

  INSERT INTO public.store_products (product_id, store, title, image, category, status, created_at, updated_at)
  VALUES 
    (NEW.id, 'kerala', NEW.name, first_image, NULL, 'draft', now(), now()),
    (NEW.id, 'pocket', NEW.name, first_image, NULL, 'draft', now(), now())
  ON CONFLICT (product_id, store) DO NOTHING;

  RETURN NEW;
END;
$$;