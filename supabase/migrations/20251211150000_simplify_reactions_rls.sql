-- Simplify post_reactions RLS - just check user owns the reaction
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Org members create reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Users delete own reactions" ON public.post_reactions;

-- Simple policies - any authenticated user can react
CREATE POLICY "View reactions"
  ON public.post_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Create own reactions"
  ON public.post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own reactions"
  ON public.post_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
