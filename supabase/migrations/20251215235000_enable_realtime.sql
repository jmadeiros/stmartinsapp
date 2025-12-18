-- Enable Realtime for chat tables
-- This allows real-time message updates without page refresh

-- Add chat tables to the realtime publication
-- Using DO block to handle case where table is already in publication
DO $$
BEGIN
  -- messages
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'messages already in publication';
  END;

  -- conversations
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'conversations already in publication';
  END;

  -- conversation_participants
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'conversation_participants already in publication';
  END;

  -- conversation_unread
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_unread;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'conversation_unread already in publication';
  END;
END $$;
