/*
# Create payment_methods table

1. New Tables
- `payment_methods` - stores saved payment methods for users
- `id` (uuid, primary key)
- `user_id` (uuid, references users.id)
- `type` (text, e.g., 'card')
- `last4` (text)
- `brand` (text)
- `expiry_month` (integer)
- `expiry_year` (integer)
- `is_default` (boolean)
- `is_active` (boolean)
- `created_at` (timestamptz)

2. Security
- Enable RLS on `payment_methods`
- Add policies for authenticated users to manage their own payment methods
*/

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'card',
  last4 TEXT,
  brand TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_select_own" ON public.payment_methods;
CREATE POLICY "payment_methods_select_own" ON public.payment_methods FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "payment_methods_insert_own" ON public.payment_methods;
CREATE POLICY "payment_methods_insert_own" ON public.payment_methods FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "payment_methods_update_own" ON public.payment_methods;
CREATE POLICY "payment_methods_update_own" ON public.payment_methods FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "payment_methods_delete_own" ON public.payment_methods;
CREATE POLICY "payment_methods_delete_own" ON public.payment_methods FOR DELETE
  TO authenticated USING (user_id = auth.uid());
