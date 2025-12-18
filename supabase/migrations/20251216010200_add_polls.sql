-- Create polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  allow_multiple BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create poll_options table
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create poll_votes table
CREATE TABLE poll_votes (
  poll_option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (poll_option_id, user_id)
);

-- Add index for faster lookups
CREATE INDEX idx_polls_post_id ON polls(post_id);
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX idx_poll_votes_poll_option_id ON poll_votes(poll_option_id);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Users can view polls"
  ON polls FOR SELECT
  USING (true);

CREATE POLICY "Users can create polls"
  ON polls FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own polls"
  ON polls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = polls.post_id
      AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own polls"
  ON polls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = polls.post_id
      AND posts.author_id = auth.uid()
    )
  );

-- RLS Policies for poll_options
CREATE POLICY "Users can view poll options"
  ON poll_options FOR SELECT
  USING (true);

CREATE POLICY "Users can create poll options"
  ON poll_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls
      JOIN posts ON posts.id = polls.post_id
      WHERE polls.id = poll_options.poll_id
      AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own poll options"
  ON poll_options FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM polls
      JOIN posts ON posts.id = polls.post_id
      WHERE polls.id = poll_options.poll_id
      AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own poll options"
  ON poll_options FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM polls
      JOIN posts ON posts.id = polls.post_id
      WHERE polls.id = poll_options.poll_id
      AND posts.author_id = auth.uid()
    )
  );

-- RLS Policies for poll_votes
CREATE POLICY "Users can view poll votes"
  ON poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can create own poll votes"
  ON poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own poll votes"
  ON poll_votes FOR DELETE
  USING (auth.uid() = user_id);
