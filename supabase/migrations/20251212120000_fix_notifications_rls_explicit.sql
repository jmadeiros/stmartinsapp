-- Fix RLS policy to allow authenticated users to create notifications
-- Using explicit public schema qualification to ensure correct table

-- Set search_path to public to be explicit
SET search_path TO public;

-- Drop all existing policies (if any)
DROP POLICY IF EXISTS "Users can create notifications for others" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications for their actions" ON public.notifications;
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Allow authenticated users to create notifications where they are the actor
-- This ensures users can only create notifications for actions they performed
CREATE POLICY "Users can create notifications for their actions"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- Allow users to read their own notifications
CREATE POLICY "Users can read their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own notifications (if needed)
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
