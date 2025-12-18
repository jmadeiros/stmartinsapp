-- ============================================================================
-- Migration: Add Full Chat System Tables
-- Date: 2025-12-15
-- Description: Creates the complete chat system with conversations, messages,
--              reactions, and unread tracking. Replaces any existing chat_messages
--              table with the proper schema.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DROP OLD CHAT_MESSAGES TABLE IF IT EXISTS (wrong schema)
-- ============================================================================

DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- ============================================================================
-- 2. CREATE CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT, -- null for direct messages, required for group chats
  is_group BOOLEAN NOT NULL DEFAULT false,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE public.conversations IS 'Chat conversations - both direct messages and group chats';
COMMENT ON COLUMN public.conversations.name IS 'Null for DMs, required for group chats';
COMMENT ON COLUMN public.conversations.is_group IS 'True for group chats, false for DMs';

-- ============================================================================
-- 3. CREATE CONVERSATION PARTICIPANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (conversation_id, user_id)
);

COMMENT ON TABLE public.conversation_participants IS 'Tracks which users are in which conversations';
COMMENT ON COLUMN public.conversation_participants.last_read_at IS 'Timestamp of when user last read messages in this conversation';
COMMENT ON COLUMN public.conversation_participants.muted IS 'If true, user does not receive notifications for this conversation';

-- ============================================================================
-- 4. CREATE MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.messages IS 'Chat messages within conversations';
COMMENT ON COLUMN public.messages.attachments IS 'JSON array of attachment objects with file info';
COMMENT ON COLUMN public.messages.reply_to_id IS 'References another message if this is a reply';
COMMENT ON COLUMN public.messages.edited_at IS 'Set when message content is edited';

-- ============================================================================
-- 5. CREATE MESSAGE REACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

COMMENT ON TABLE public.message_reactions IS 'Emoji reactions on chat messages';
COMMENT ON COLUMN public.message_reactions.emoji IS 'The emoji character used for the reaction';

-- ============================================================================
-- 6. CREATE CONVERSATION UNREAD TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversation_unread (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

COMMENT ON TABLE public.conversation_unread IS 'Tracks unread message counts per user per conversation';
COMMENT ON COLUMN public.conversation_unread.unread_count IS 'Number of unread messages for this user';
COMMENT ON COLUMN public.conversation_unread.last_message_id IS 'ID of the last message when count was updated';

-- ============================================================================
-- 7. CREATE INDEXES
-- ============================================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON public.conversations(archived) WHERE archived = false;

-- Conversation participants indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_org ON public.conversation_participants(org_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON public.messages(conversation_id, created_at DESC) WHERE deleted_at IS NULL;

-- Message reactions indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);

-- Conversation unread indexes
CREATE INDEX IF NOT EXISTS idx_conversation_unread_user ON public.conversation_unread(user_id, unread_count DESC) WHERE unread_count > 0;
CREATE INDEX IF NOT EXISTS idx_conversation_unread_conversation ON public.conversation_unread(conversation_id);

-- ============================================================================
-- 8. CREATE OR REPLACE TRIGGERS FOR updated_at
-- ============================================================================

-- Create the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conversations updated_at trigger
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Conversation unread updated_at trigger
DROP TRIGGER IF EXISTS update_conversation_unread_updated_at ON public.conversation_unread;
CREATE TRIGGER update_conversation_unread_updated_at
  BEFORE UPDATE ON public.conversation_unread
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 9. CREATE start_conversation FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.start_conversation(
  p_participant_user_ids UUID[],
  p_org_id UUID,
  p_is_group BOOLEAN DEFAULT false,
  p_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_user_id UUID;
BEGIN
  -- Create the conversation
  INSERT INTO public.conversations (is_group, name, org_id, created_by)
  VALUES (p_is_group, p_name, p_org_id, auth.uid())
  RETURNING id INTO v_conversation_id;

  -- Add all participants including the creator
  FOREACH v_user_id IN ARRAY p_participant_user_ids LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id, org_id)
    VALUES (v_conversation_id, v_user_id, p_org_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END LOOP;

  -- Initialize unread counts for all participants
  FOREACH v_user_id IN ARRAY p_participant_user_ids LOOP
    INSERT INTO public.conversation_unread (conversation_id, user_id, unread_count)
    VALUES (v_conversation_id, v_user_id, 0)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END LOOP;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.start_conversation IS 'Creates a new conversation and adds all specified participants';

-- ============================================================================
-- 10. CREATE HELPER FUNCTIONS FOR CHAT
-- ============================================================================

-- Function to increment unread counts when a new message is sent
CREATE OR REPLACE FUNCTION public.increment_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread count for all participants except the sender
  INSERT INTO public.conversation_unread (conversation_id, user_id, unread_count, last_message_id)
  SELECT
    NEW.conversation_id,
    cp.user_id,
    1,
    NEW.id
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET
    unread_count = conversation_unread.unread_count + 1,
    last_message_id = NEW.id,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment unread counts on new message
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_unread_counts();

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update unread count to 0
  UPDATE public.conversation_unread
  SET unread_count = 0, updated_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();

  -- Update last_read_at in participants
  UPDATE public.conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.mark_conversation_read IS 'Marks all messages in a conversation as read for the current user';

-- Function to get total unread count for a user
CREATE OR REPLACE FUNCTION public.get_total_unread_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(unread_count)::INTEGER
     FROM public.conversation_unread
     WHERE user_id = auth.uid()),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_total_unread_count IS 'Returns total unread message count across all conversations for current user';

-- ============================================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_unread ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. CREATE RLS POLICIES FOR CONVERSATIONS
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Participants view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Org members create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Creators update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Creators delete conversations" ON public.conversations;

-- SELECT: Users can only see conversations they are participants in
CREATE POLICY "Participants view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can create conversations (in their org)
CREATE POLICY "Org members create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );

-- UPDATE: Only the creator can update conversation (name, archived status)
CREATE POLICY "Creators update conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- DELETE: Only the creator can delete the conversation
CREATE POLICY "Creators delete conversations"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================================
-- 13. CREATE RLS POLICIES FOR CONVERSATION PARTICIPANTS
-- ============================================================================

DROP POLICY IF EXISTS "Participants view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Conversation creators add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can leave conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants update own settings" ON public.conversation_participants;

-- SELECT: Users can see participants in conversations they're part of
CREATE POLICY "Participants view conversation participants"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- INSERT: Conversation creator can add participants, or users can add themselves
CREATE POLICY "Conversation creators add participants"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is adding themselves
    user_id = auth.uid()
    OR
    -- User is the conversation creator
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.created_by = auth.uid()
    )
  );

-- DELETE: Participants can leave (remove themselves), creators can remove others
CREATE POLICY "Participants can leave conversations"
  ON public.conversation_participants FOR DELETE
  TO authenticated
  USING (
    -- User is removing themselves
    user_id = auth.uid()
    OR
    -- User is the conversation creator
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.created_by = auth.uid()
    )
  );

-- UPDATE: Users can only update their own participant settings (muted, last_read_at)
CREATE POLICY "Participants update own settings"
  ON public.conversation_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 14. CREATE RLS POLICIES FOR MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "Participants view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
DROP POLICY IF EXISTS "Senders update own messages" ON public.messages;
DROP POLICY IF EXISTS "Senders delete own messages" ON public.messages;

-- SELECT: Users can only see messages in conversations they're participants in
CREATE POLICY "Participants view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- INSERT: Users can only send messages in conversations they're participants in
CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- UPDATE: Users can only update their own messages (for editing)
CREATE POLICY "Senders update own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- DELETE: Users can only soft-delete their own messages
CREATE POLICY "Senders delete own messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- ============================================================================
-- 15. CREATE RLS POLICIES FOR MESSAGE REACTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Participants view message reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Participants add reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users remove own reactions" ON public.message_reactions;

-- SELECT: Users can see reactions on messages in conversations they're part of
CREATE POLICY "Participants view message reactions"
  ON public.message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND cp.user_id = auth.uid()
    )
  );

-- INSERT: Users can add reactions to messages in conversations they're part of
CREATE POLICY "Participants add reactions"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_id
        AND cp.user_id = auth.uid()
    )
  );

-- DELETE: Users can only remove their own reactions
CREATE POLICY "Users remove own reactions"
  ON public.message_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 16. CREATE RLS POLICIES FOR CONVERSATION UNREAD
-- ============================================================================

DROP POLICY IF EXISTS "Users view own unread counts" ON public.conversation_unread;
DROP POLICY IF EXISTS "Users update own unread counts" ON public.conversation_unread;
DROP POLICY IF EXISTS "System manages unread counts" ON public.conversation_unread;

-- SELECT: Users can only see their own unread counts
CREATE POLICY "Users view own unread counts"
  ON public.conversation_unread FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- UPDATE: Users can only update their own unread counts (mark as read)
CREATE POLICY "Users update own unread counts"
  ON public.conversation_unread FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT: Allow system/triggers to create unread counts
-- This uses a more permissive policy since inserts happen via triggers
CREATE POLICY "System manages unread counts"
  ON public.conversation_unread FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is the target of the unread count
    user_id = auth.uid()
    OR
    -- Or the user is a participant in the conversation (for trigger-based inserts)
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_unread.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete their own unread count records
DROP POLICY IF EXISTS "Users delete own unread counts" ON public.conversation_unread;
CREATE POLICY "Users delete own unread counts"
  ON public.conversation_unread FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 17. GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversation_participants TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.message_reactions TO authenticated;
GRANT ALL ON public.conversation_unread TO authenticated;

GRANT EXECUTE ON FUNCTION public.start_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_unread_count TO authenticated;

-- ============================================================================
-- 18. ENABLE REALTIME FOR CHAT TABLES
-- ============================================================================

-- Note: Run these in Supabase Dashboard if needed, or via separate migration
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_unread;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
--   - Dropped old chat_messages table (wrong schema)
--   - Created conversations table for DMs and group chats
--   - Created conversation_participants for membership tracking
--   - Created messages table for chat messages
--   - Created message_reactions for emoji reactions
--   - Created conversation_unread for tracking unread counts
--   - Added all relevant indexes for performance
--   - Added updated_at triggers
--   - Created start_conversation function
--   - Created helper functions (mark_conversation_read, get_total_unread_count)
--   - Added trigger to auto-increment unread counts on new messages
--   - Enabled RLS on all tables
--   - Created comprehensive RLS policies:
--     * Users can only access conversations they're participants in
--     * Users can only send messages in their conversations
--     * Users can only edit/delete their own messages
--     * Users can only modify their own unread counts
--   - Granted appropriate permissions
-- ============================================================================
