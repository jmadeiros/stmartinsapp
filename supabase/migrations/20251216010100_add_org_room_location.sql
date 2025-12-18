-- Add room_location column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS room_location TEXT;

-- Add comment to document the column
COMMENT ON COLUMN organizations.room_location IS 'Physical room or location within the building (e.g., "Room 205", "Ground Floor, West Wing")';
