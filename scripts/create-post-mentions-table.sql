-- Create post_mentions table for tracking @user mentions in posts
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.post_mentions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Prevent duplicate mentions of the same user in the same post
  UNIQUE(post_id, mentioned_user_id)
);

-- Index for efficient lookups by post
CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id ON public.post_mentions(post_id);

-- Index for finding all posts that mention a specific user
CREATE INDEX IF NOT EXISTS idx_post_mentions_mentioned_user_id ON public.post_mentions(mentioned_user_id);

-- Enable RLS
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read mentions
CREATE POLICY "Anyone can read post mentions" ON public.post_mentions
  FOR SELECT USING (true);

-- RLS Policy: Only authenticated users can create mentions (through the posts system)
CREATE POLICY "Authenticated users can create post mentions" ON public.post_mentions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Only post author can delete mentions
CREATE POLICY "Post author can delete mentions" ON public.post_mentions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_mentions.post_id
      AND posts.author_id = auth.uid()
    )
  );

COMMENT ON TABLE public.post_mentions IS 'Tracks @user mentions in posts for notifications and linking';
COMMENT ON COLUMN public.post_mentions.post_id IS 'The post containing the mention';
COMMENT ON COLUMN public.post_mentions.mentioned_user_id IS 'The user being mentioned';
