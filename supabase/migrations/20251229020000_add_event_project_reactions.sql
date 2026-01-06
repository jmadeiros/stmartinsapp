-- Add event_reactions table for liking events
CREATE TABLE IF NOT EXISTS event_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, reaction_type)
);

-- Add project_reactions table for liking projects
CREATE TABLE IF NOT EXISTS project_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id, reaction_type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_reactions_event_id ON event_reactions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reactions_user_id ON event_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_reactions_project_id ON project_reactions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reactions_user_id ON project_reactions(user_id);

-- Enable RLS
ALTER TABLE event_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_reactions
CREATE POLICY "Users can view all event reactions"
  ON event_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own event reactions"
  ON event_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event reactions"
  ON event_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for project_reactions
CREATE POLICY "Users can view all project reactions"
  ON project_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own project reactions"
  ON project_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project reactions"
  ON project_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE event_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE project_reactions;
