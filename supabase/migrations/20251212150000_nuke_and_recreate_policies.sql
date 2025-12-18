-- Nuclear option: Drop ALL policies on notifications and recreate
-- This uses a DO block to dynamically drop all policies

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on the notifications table
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

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
