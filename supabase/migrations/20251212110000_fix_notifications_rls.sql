-- Fix RLS policy to allow authenticated users to create notifications
-- This is required because server actions run as authenticated users, not as service role

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can create notifications for others" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications for their actions" ON notifications;
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Allow authenticated users to create notifications where they are the actor
-- This ensures users can only create notifications for actions they performed
CREATE POLICY "Users can create notifications for their actions"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- Allow users to read their own notifications
CREATE POLICY "Users can read their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own notifications (if needed)
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add comment explaining the policy
COMMENT ON POLICY "Users can create notifications for their actions" ON notifications IS
'Allows authenticated users to create notifications where they are the actor (creator of the notification).
This is required for server actions like addComment, toggleReaction, etc. to create notifications.';
