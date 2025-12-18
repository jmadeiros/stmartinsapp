-- Comprehensive fix for notifications RLS policies
-- This migration drops ALL possible policies and creates the correct ones

-- First, let's drop any possible policy names that might exist
-- (we're being comprehensive here to cover all bases)
DROP POLICY IF EXISTS "Users can create notifications for others" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications for their actions" ON public.notifications;
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.notifications;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.notifications;
DROP POLICY IF EXISTS "Service role can do anything" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can modify own notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
-- Supabase default policy names
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to create notifications" ON public.notifications;

-- Make sure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create the correct INSERT policy
-- Users can create notifications where they are the actor (performing the action)
-- This allows User A to create a notification for User B when A comments on B's post
CREATE POLICY "notifications_insert_policy"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- Create the SELECT policy
-- Users can only read notifications addressed to them
CREATE POLICY "notifications_select_policy"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create the UPDATE policy
-- Users can only update their own notifications (e.g., mark as read)
CREATE POLICY "notifications_update_policy"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create the DELETE policy
-- Users can only delete their own notifications
CREATE POLICY "notifications_delete_policy"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add comments
COMMENT ON POLICY "notifications_insert_policy" ON public.notifications IS
'Allows authenticated users to create notifications where they are the actor. This enables cross-user notifications (e.g., User A notifying User B about a comment).';

COMMENT ON POLICY "notifications_select_policy" ON public.notifications IS
'Users can only read notifications addressed to them (user_id = auth.uid()).';

COMMENT ON POLICY "notifications_update_policy" ON public.notifications IS
'Users can only update/modify their own notifications (e.g., mark as read).';

COMMENT ON POLICY "notifications_delete_policy" ON public.notifications IS
'Users can only delete their own notifications.';
