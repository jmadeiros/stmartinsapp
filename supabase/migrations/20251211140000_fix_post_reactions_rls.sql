-- Enable RLS on post_reactions if not already enabled
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Org members view reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Org members create reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Users delete own reactions" ON public.post_reactions;

-- Anyone can view reactions
CREATE POLICY "Anyone can view reactions"
  ON public.post_reactions FOR SELECT
  TO authenticated
  USING (true);

-- Org members can create reactions (simplified)
CREATE POLICY "Org members create reactions"
  ON public.post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id
        AND p.org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
    )
  );

-- Users delete own reactions
CREATE POLICY "Users delete own reactions"
  ON public.post_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
