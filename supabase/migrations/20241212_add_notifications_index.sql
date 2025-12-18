-- Add index for faster notification queries
-- This speeds up queries filtering by user_id and sorting by created_at

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON notifications(user_id, created_at DESC);

-- Optional: Add index for unread notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
ON notifications(user_id, read, created_at DESC);

-- Add comment explaining the optimization
COMMENT ON INDEX idx_notifications_user_created IS
'Speeds up notification fetching by user with recent-first ordering';
