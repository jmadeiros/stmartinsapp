-- Add comments tables for events and projects
-- Mirrors the structure of post_comments for consistency

-- Event Comments Table
CREATE TABLE IF NOT EXISTS public.event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.event_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Project Comments Table
CREATE TABLE IF NOT EXISTS public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for event_comments
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON public.event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_author_id ON public.event_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_parent ON public.event_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created_at ON public.event_comments(created_at);

-- Indexes for project_comments
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_author_id ON public.project_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_parent ON public.project_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_created_at ON public.project_comments(created_at);

-- Enable RLS
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_comments

-- Anyone authenticated can view non-deleted comments
CREATE POLICY "event_comments_select_policy" ON public.event_comments
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Authenticated users can insert comments
CREATE POLICY "event_comments_insert_policy" ON public.event_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "event_comments_update_policy" ON public.event_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete (soft-delete) their own comments
CREATE POLICY "event_comments_delete_policy" ON public.event_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for project_comments

-- Anyone authenticated can view non-deleted comments
CREATE POLICY "project_comments_select_policy" ON public.project_comments
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Authenticated users can insert comments
CREATE POLICY "project_comments_insert_policy" ON public.project_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "project_comments_update_policy" ON public.project_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete (soft-delete) their own comments
CREATE POLICY "project_comments_delete_policy" ON public.project_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Trigger function for updating updated_at on event_comments
CREATE OR REPLACE FUNCTION update_event_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for updating updated_at on project_comments
CREATE OR REPLACE FUNCTION update_project_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS event_comments_updated_at ON public.event_comments;
CREATE TRIGGER event_comments_updated_at
  BEFORE UPDATE ON public.event_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_event_comment_updated_at();

DROP TRIGGER IF EXISTS project_comments_updated_at ON public.project_comments;
CREATE TRIGGER project_comments_updated_at
  BEFORE UPDATE ON public.project_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_comment_updated_at();
