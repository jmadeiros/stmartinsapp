-- ============================================================================
-- Migration: Add Foreign Key from messages to user_profiles
-- Date: 2025-12-15
-- Description: Creates a foreign key relationship between messages.sender_id
--              and user_profiles.user_id to enable proper JOIN queries
-- ============================================================================

BEGIN;

-- The messages table currently has sender_id pointing to auth.users(id)
-- But we need to be able to join to user_profiles for display information
-- user_profiles.user_id is a foreign key to auth.users(id)
-- So we can safely add an FK from messages.sender_id to user_profiles.user_id

-- First, check if all sender_ids have corresponding user_profiles
-- (This should always be true if user setup is correct)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.messages m
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = m.sender_id
    )
  ) THEN
    RAISE NOTICE 'Warning: Some messages have sender_ids without corresponding user_profiles';
  END IF;
END $$;

-- First, drop the existing constraint if it exists (it might be pointing to auth.users)
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Add the correct foreign key constraint
-- This allows us to do messages.sender_id -> user_profiles.user_id in queries
ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES public.user_profiles(user_id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT messages_sender_id_fkey ON public.messages
  IS 'Links message sender to their user profile for display information';

-- Create an index to speed up the JOIN
CREATE INDEX IF NOT EXISTS idx_messages_sender_profile
  ON public.messages(sender_id);

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
--   - Added foreign key from messages.sender_id to user_profiles.user_id
--   - This enables JOIN queries to fetch sender display information
--   - Added index for performance
-- ============================================================================
