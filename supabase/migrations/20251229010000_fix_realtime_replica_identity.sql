-- Fix Realtime for filtered subscriptions
-- Set REPLICA IDENTITY FULL on tables that use filtered realtime subscriptions
-- This is REQUIRED for realtime filters like `filter: user_id=eq.${userId}` to work
-- Without REPLICA IDENTITY FULL, filtered subscriptions won't receive changes

-- notifications table - filtered by user_id
ALTER TABLE IF EXISTS public.notifications REPLICA IDENTITY FULL;

-- messages table - filtered by conversation_id
ALTER TABLE IF EXISTS public.messages REPLICA IDENTITY FULL;

-- conversation_unread table - filtered by user_id
ALTER TABLE IF EXISTS public.conversation_unread REPLICA IDENTITY FULL;

-- Note: This migration should be applied after the tables are created
-- Run with: npx supabase db push
