-- Complete RLS fix for chat tables
-- This migration creates a helper function and fixes all policies

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTION (bypasses RLS for membership checks)
-- ============================================================================

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

GRANT EXECUTE ON FUNCTION public.user_is_conversation_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_conversation_participant(UUID, UUID) TO anon;

-- ============================================================================
-- 2. FIX CONVERSATION_PARTICIPANTS POLICIES
-- ============================================================================

-- Drop ALL existing policies on conversation_participants
DROP POLICY IF EXISTS "Participants view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants view all conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users view their own participations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users view co-participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "View conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users leave conversations" ON public.conversation_participants;

-- Create new policies using the helper function
CREATE POLICY "cp_select"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (public.user_is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "cp_insert"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.user_is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "cp_delete"
  ON public.conversation_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. FIX MESSAGES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Participants view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
DROP POLICY IF EXISTS "View conversation messages" ON public.messages;
DROP POLICY IF EXISTS "Send conversation messages" ON public.messages;
DROP POLICY IF EXISTS "Senders edit own messages" ON public.messages;
DROP POLICY IF EXISTS "Senders delete own messages" ON public.messages;

CREATE POLICY "msg_select"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.user_is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "msg_insert"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.user_is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "msg_update"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "msg_delete"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- ============================================================================
-- 4. FIX CONVERSATIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Participants view conversations" ON public.conversations;
DROP POLICY IF EXISTS "View conversations" ON public.conversations;
DROP POLICY IF EXISTS "Org members create conversations" ON public.conversations;

CREATE POLICY "conv_select"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (public.user_is_conversation_participant(id, auth.uid()));

CREATE POLICY "conv_insert"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- 5. FIX MESSAGE_REACTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Participants view reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Participants add reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users remove own reactions" ON public.message_reactions;

CREATE POLICY "react_select"
  ON public.message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND public.user_is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

CREATE POLICY "react_insert"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND public.user_is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

CREATE POLICY "react_delete"
  ON public.message_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 6. FIX CONVERSATION_UNREAD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users view own unread counts" ON public.conversation_unread;
DROP POLICY IF EXISTS "System updates unread counts" ON public.conversation_unread;

CREATE POLICY "unread_select"
  ON public.conversation_unread FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "unread_all"
  ON public.conversation_unread FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
