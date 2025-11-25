-- ============================================================================
-- Schema Simplification: Remove unnecessary tables for MVP
-- ============================================================================
-- This removes complex features we don't need yet:
-- - DM system (conversations, messages, etc.)
-- - Connection requests (everyone sees everyone)
-- - Meeting attendees/comments
-- - Project tasks
-- Keeps simple single-channel chat for now
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DROP UNNECESSARY TABLES
-- ============================================================================

-- Drop DM/messaging system (5 tables)
DROP TABLE IF EXISTS public.conversation_unread CASCADE;
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Drop social networking
DROP TABLE IF EXISTS public.connection_requests CASCADE;

-- Drop complex meeting features
DROP TABLE IF EXISTS public.meeting_note_comments CASCADE;
DROP TABLE IF EXISTS public.meeting_attendees CASCADE;

-- Drop project task management (keep project_updates, remove tasks)
DROP TABLE IF EXISTS public.project_tasks CASCADE;

-- ============================================================================
-- 2. SIMPLIFY CHAT TO SINGLE GLOBAL CHANNEL
-- ============================================================================

-- Drop existing complex chat tables if they exist
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_channels CASCADE;

-- Create simple single-channel chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create index for fast message retrieval
CREATE INDEX idx_chat_messages_created
  ON public.chat_messages(created_at DESC)
  WHERE deleted_at IS NULL;

-- Create index for user's messages
CREATE INDEX idx_chat_messages_user
  ON public.chat_messages(user_id);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view messages
CREATE POLICY "Users can view all messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- RLS Policy: Users can send messages
CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can update own messages
CREATE POLICY "Users can update own messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policy: Users can delete own messages
CREATE POLICY "Users can delete own messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check what tables remain in public schema
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type IN ('BASE TABLE', 'VIEW')
ORDER BY table_type, table_name;

-- Show count
SELECT
  table_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type IN ('BASE TABLE', 'VIEW')
GROUP BY table_type;
