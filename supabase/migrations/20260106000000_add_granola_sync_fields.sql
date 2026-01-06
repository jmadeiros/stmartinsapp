-- Add Granola sync fields to meeting_notes table
-- These columns support syncing meeting notes from Granola

-- Add granola_id column (unique identifier from Granola)
ALTER TABLE meeting_notes
ADD COLUMN IF NOT EXISTS granola_id UUID UNIQUE;

-- Add granola_updated_at column (to detect changes in Granola)
ALTER TABLE meeting_notes
ADD COLUMN IF NOT EXISTS granola_updated_at TIMESTAMPTZ;

-- Add synced_at column (when last synced with Granola)
ALTER TABLE meeting_notes
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Add content_html column (original HTML content from Granola)
ALTER TABLE meeting_notes
ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Add attendees column (meeting participants as JSONB array)
ALTER TABLE meeting_notes
ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]';

-- Create index on granola_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_meeting_notes_granola_id ON meeting_notes(granola_id);
