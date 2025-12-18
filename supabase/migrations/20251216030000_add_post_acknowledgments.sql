-- Create post_acknowledgments table
CREATE TABLE IF NOT EXISTS public.post_acknowledgments (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Users can view acknowledgments
CREATE POLICY "Users can view acknowledgments" ON public.post_acknowledgments
  FOR SELECT TO authenticated USING (true);

-- Users can acknowledge (insert their own acknowledgment)
CREATE POLICY "Users can acknowledge" ON public.post_acknowledgments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Index for quick lookups by post
CREATE INDEX idx_post_acknowledgments_post_id ON public.post_acknowledgments(post_id);

-- Index for quick lookups by user
CREATE INDEX idx_post_acknowledgments_user_id ON public.post_acknowledgments(user_id);

-- Add comment for documentation
COMMENT ON TABLE public.post_acknowledgments IS 'Tracks user acknowledgments for priority alert posts';
