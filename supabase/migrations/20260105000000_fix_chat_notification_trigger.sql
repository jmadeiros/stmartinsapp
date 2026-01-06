-- ============================================================================
-- Migration: Fix Chat Notification Trigger UUID Type Mismatch
-- Date: 2026-01-05
-- Description: Fixes the notify_on_new_message trigger that was casting
--              message ID to TEXT when reference_id column expects UUID.
--              This was preventing chat messages from being sent.
-- ============================================================================

BEGIN;

-- Drop and recreate the function with the correct type
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_participant RECORD;
  v_sender_name TEXT;
  v_conversation_name TEXT;
  v_notification_title TEXT;
  v_notification_link TEXT;
BEGIN
  -- Get sender name from user_profiles
  SELECT full_name INTO v_sender_name
  FROM public.user_profiles
  WHERE user_id = NEW.sender_id;

  -- Default to 'Someone' if name not found
  v_sender_name := COALESCE(v_sender_name, 'Someone');

  -- Get conversation name (or construct DM name)
  SELECT
    CASE
      WHEN c.is_group THEN COALESCE(c.name, 'Group Chat')
      ELSE 'Direct Message'
    END INTO v_conversation_name
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  -- Construct notification title
  v_notification_title := v_sender_name || ' sent a message';
  IF v_conversation_name = 'Direct Message' THEN
    v_notification_title := v_sender_name || ' sent you a message';
  ELSE
    v_notification_title := v_sender_name || ' in #' || COALESCE(
      (SELECT name FROM public.conversations WHERE id = NEW.conversation_id),
      'chat'
    );
  END IF;

  -- Construct link to conversation
  v_notification_link := '/chat?conversation=' || NEW.conversation_id::TEXT;

  -- Create notification for each participant except sender
  FOR v_participant IN
    SELECT cp.user_id
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id != NEW.sender_id
      AND cp.muted = false  -- Skip muted participants
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      actor_id,
      reference_type,
      reference_id,
      link,
      action_data,
      read
    ) VALUES (
      v_participant.user_id,
      'chat_message',
      v_notification_title,
      NEW.sender_id,
      'message',
      NEW.id,  -- FIX: Don't cast to TEXT - reference_id is UUID type
      v_notification_link,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'preview', LEFT(NEW.content, 100)
      ),
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.notify_on_new_message IS
  'Creates notifications for all conversation participants (except sender and muted users) when a new message is sent. Fixed: reference_id now correctly passed as UUID.';

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
--   - Fixed notify_on_new_message() function
--   - Changed NEW.id::TEXT to NEW.id (line 72)
--   - reference_id column is UUID type, not TEXT
--   - This was blocking all chat message inserts
-- ============================================================================
