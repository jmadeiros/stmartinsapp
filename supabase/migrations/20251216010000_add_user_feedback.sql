-- Create user_feedback table for collecting user feedback
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  page_url TEXT,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add check constraint for feedback_type
ALTER TABLE user_feedback ADD CONSTRAINT feedback_type_check
  CHECK (feedback_type IN ('bug', 'feature', 'general', 'question', 'other'));

-- Add check constraint for status
ALTER TABLE user_feedback ADD CONSTRAINT feedback_status_check
  CHECK (status IN ('new', 'in_review', 'planned', 'completed', 'dismissed'));

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);

-- Create index on status for admin filtering
CREATE INDEX idx_user_feedback_status ON user_feedback(status);

-- Create index on created_at for sorting
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all feedback (for future admin panel)
CREATE POLICY "Admins can view all feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'st_martins_staff')
    )
  );

-- Policy: Admins can update feedback status
CREATE POLICY "Admins can update feedback status"
  ON user_feedback
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'st_martins_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'st_martins_staff')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_user_feedback_updated_at();

-- Add comment to table
COMMENT ON TABLE user_feedback IS 'Stores user feedback, bug reports, and feature requests';
