/*
# Fix RLS policies and add missing database objects

## Problem
The application has several RLS policy gaps and missing database objects that prevent core features from working:

1. **Users SELECT policy too restrictive**: The `users_select_own` policy only allows users to see their own row. But the app needs to display expert/client names in bookings, messages, and reviews.
2. **Missing notifications INSERT policy**: Notifications can't be created by the booking system because no INSERT policy exists.
3. **Missing payments INSERT/UPDATE/DELETE policies**: Payment operations fail silently.
4. **Missing RPC function**: `increment_expert_consultations` is called in the booking completion flow but doesn't exist.
5. **Missing `expert_id` on payments**: The `useExpertEarnings` hook queries `payments.expert_id` which doesn't exist.

## Changes

1. **Users table** - Add a permissive SELECT policy so all authenticated users can view public profile info (name, avatar, email, role). This is required for the marketplace to display expert/client names across bookings, messages, and reviews.

2. **Notifications table** - Add INSERT policy (allowing any authenticated user to insert notifications for any user, required for the frontend booking service to notify experts). Add DELETE policy for users to remove their own notifications.

3. **Payments table** - Add INSERT, UPDATE, and DELETE policies so the payment system can operate. Add `expert_id` column for the expert earnings query.

4. **RPC function** - Add `increment_expert_consultations()` for the booking completion flow.

## Security Notes
- The `users_select_other` policy allows all authenticated users to see all user profiles. This is intentional for a marketplace where users need to see each other's names.
- The `notifications_insert` policy allows inserting for any user_id because notifications are triggered by user actions (e.g., a client booking creates a notification for the expert). This could be hardened with an edge function in the future.
*/

-- 1. Fix users SELECT policy to allow cross-user lookups for bookings/experts
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_other" ON public.users;

CREATE POLICY "users_select_other" ON public.users FOR SELECT
  TO authenticated USING (true);

-- 2. Add notifications INSERT policy
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (true);

-- 3. Add notifications DELETE policy
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- 4. Add payments INSERT policy
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT
  TO authenticated WITH CHECK (true);

-- 5. Add payments UPDATE policy
DROP POLICY IF EXISTS "payments_update" ON public.payments;
CREATE POLICY "payments_update" ON public.payments FOR UPDATE
  TO authenticated USING (true);

-- 6. Add payments DELETE policy
DROP POLICY IF EXISTS "payments_delete" ON public.payments;
CREATE POLICY "payments_delete" ON public.payments FOR DELETE
  TO authenticated USING (true);

-- 7. Add expert_id to payments table for expert earnings queries
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS expert_id UUID REFERENCES public.experts(id);

-- 8. Create RPC function for incrementing expert consultations
CREATE OR REPLACE FUNCTION increment_expert_consultations(expert_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.experts
  SET total_consultations = total_consultations + 1
  WHERE id = expert_id;
END;
$$ LANGUAGE plpgsql;
