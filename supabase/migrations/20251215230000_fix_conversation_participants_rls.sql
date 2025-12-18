-- Fix infinite recursion in conversation_participants RLS policy
-- The original policy queries the same table it's protecting, causing infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Participants view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants view all conversation participants" ON public.conversation_participants;

-- Create fixed SELECT policy: Users can see participant records for conversations they're in
-- This avoids recursion by using a direct user_id check first
CREATE POLICY "Users view their own participations"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create a second policy for viewing OTHER participants in conversations the user is part of
-- This uses a subquery that first checks user's own participation (which is allowed by the policy above)
CREATE POLICY "Users view co-participants"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id
      FROM public.conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Note: The INSERT/UPDATE/DELETE policies don't have recursion issues and remain unchanged
