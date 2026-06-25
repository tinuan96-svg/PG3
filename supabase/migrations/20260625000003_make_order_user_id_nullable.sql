-- Allow guest checkout by making user_id nullable on orders table
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
