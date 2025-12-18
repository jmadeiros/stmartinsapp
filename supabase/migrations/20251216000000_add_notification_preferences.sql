-- Add granular notification preferences to user_settings table
-- This allows users to control each type of notification independently

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS notify_reactions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_comments boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_mentions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_event_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_project_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_collaboration_invitations boolean DEFAULT true;

-- Add comment to table
COMMENT ON COLUMN public.user_settings.notify_reactions IS 'Receive notifications when someone likes your posts';
COMMENT ON COLUMN public.user_settings.notify_comments IS 'Receive notifications when someone comments on your posts';
COMMENT ON COLUMN public.user_settings.notify_mentions IS 'Receive notifications when someone mentions you';
COMMENT ON COLUMN public.user_settings.notify_event_updates IS 'Receive notifications about event RSVPs and reminders';
COMMENT ON COLUMN public.user_settings.notify_project_updates IS 'Receive notifications about project updates';
COMMENT ON COLUMN public.user_settings.notify_collaboration_invitations IS 'Receive notifications when invited to collaborate';

-- Priority alerts are always enabled and cannot be disabled (handled in application logic)
