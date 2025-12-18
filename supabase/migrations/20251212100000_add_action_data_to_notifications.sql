-- Add action_data column to notifications table
-- This column stores additional context for notifications as flexible JSONB data
--
-- Example data stored:
--   - post_preview: excerpt of the post that was liked/commented on
--   - comment_preview: text of the comment that was made
--   - event_title: name of the event for event-related notifications
--   - project_title: name of the project for project-related notifications
--   - reaction_type: type of reaction (like, celebrate, etc.)
--   - invitation_id: ID of collaboration invitation
--   - Any other contextual data specific to notification type

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS action_data JSONB;

-- Add a comment to the column explaining its purpose
COMMENT ON COLUMN notifications.action_data IS
'Stores flexible contextual data for notifications (post_preview, comment_preview, event_title, project_title, etc.)';

-- Create a GIN index for efficient JSONB queries if needed in the future
CREATE INDEX IF NOT EXISTS idx_notifications_action_data
ON notifications USING GIN (action_data)
WHERE action_data IS NOT NULL;
