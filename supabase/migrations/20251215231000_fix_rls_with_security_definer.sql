-- Fix RLS infinite recursion using SECURITY DEFINER function
-- The function bypasses RLS when checking membership, avoiding recursion

-- Drop the problematic policies from previous migration
DROP POLICY IF EXISTS "Users view co-participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users view their own participations" ON public.conversation_participants;

-- Create a SECURITY DEFINER function to check conversation membership
-- This function runs with the privileges of the function owner (postgres)
-- and bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.user_is_conversation_participant(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_is_conversation_participant(UUID, UUID) TO authenticated;

-- Now create RLS policies that use the function instead of self-referential subqueries

-- SELECT: Users can see participants of conversations they're in
CREATE POLICY "View conversation participants"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (
    public.user_is_conversation_participant(conversation_id, auth.uid())
  );

-- Also update the messages table policies to use the function
DROP POLICY IF EXISTS "Participants view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants send messages" ON public.messages;

CREATE POLICY "View conversation messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    public.user_is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "Send conversation messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.user_is_conversation_participant(conversation_id, auth.uid())
  );

-- Update conversations policies too
DROP POLICY IF EXISTS "Participants view conversations" ON public.conversations;

CREATE POLICY "View conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    public.user_is_conversation_participant(id, auth.uid())
  );
