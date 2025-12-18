-- ============================================================================
-- Migration: Add Chat Message Notifications Trigger
-- Date: 2025-12-15
-- Description: Creates a trigger to generate notifications when new chat
--              messages are sent, notifying all participants except the sender.
--              Respects muted conversation settings.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE NOTIFICATION FUNCTION FOR NEW MESSAGES
-- ============================================================================

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
      NEW.id::TEXT,
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
  'Creates notifications for all conversation participants (except sender and muted users) when a new message is sent';

-- ============================================================================
-- 2. CREATE TRIGGER ON MESSAGES TABLE
-- ============================================================================

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_new_message_notify ON public.messages;

-- Create trigger
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();

-- ============================================================================
-- 3. GRANT EXECUTE PERMISSION
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.notify_on_new_message TO authenticated;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
--   - Created notify_on_new_message() function
--   - Function creates notifications for all conversation participants except:
--     * The message sender
--     * Participants who have muted the conversation
--   - Notifications include:
--     * User-friendly title with sender name
--     * Link to the conversation
--     * Action data with message preview and IDs
--   - Created trigger on_new_message_notify on messages table
-- ============================================================================
