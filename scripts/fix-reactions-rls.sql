-- Fix Post Reactions RLS and member_orgs function
-- Run this SQL in your Supabase SQL Editor to fix post reactions functionality

-- 1. Fix the member_orgs function to use user_profiles instead of user_memberships
CREATE OR REPLACE FUNCTION public.member_orgs(p_user_id UUID)
RETURNS TABLE (org_id UUID, role public.user_role) AS $$
BEGIN
  RETURN QUERY
  SELECT up.organization_id, up.role
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id
    AND up.organization_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.member_orgs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.member_orgs(UUID) TO anon;

-- 2. Enable RLS on post_reactions
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing policies
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Org members create reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Users delete own reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "View reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Create own reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Delete own reactions" ON public.post_reactions;

-- 4. Create simplified RLS policies (don't require member_orgs for basic like functionality)
-- Any authenticated user can view reactions
CREATE POLICY "View reactions"
  ON public.post_reactions FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create reactions on their own behalf
CREATE POLICY "Create own reactions"
  ON public.post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own reactions
CREATE POLICY "Delete own reactions"
  ON public.post_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Grant permissions
GRANT SELECT, INSERT, DELETE ON public.post_reactions TO authenticated;
GRANT SELECT ON public.post_reactions TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Post reactions RLS policies have been fixed successfully.';
END $$;
