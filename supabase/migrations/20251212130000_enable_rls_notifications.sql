-- Ensure RLS is enabled on the notifications table
-- and re-create policies

-- Enable RLS (this is idempotent - won't fail if already enabled)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (important for service role if needed)
-- Note: We might want authenticated users to bypass RLS in some cases
-- ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can create notifications for others" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications for their actions" ON public.notifications;
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can do anything" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.notifications;

-- Create INSERT policy: Users can create notifications where they are the actor
CREATE POLICY "Users can create notifications for their actions"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- Create SELECT policy: Users can read their own notifications
CREATE POLICY "Users can read their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create UPDATE policy: Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create DELETE policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
