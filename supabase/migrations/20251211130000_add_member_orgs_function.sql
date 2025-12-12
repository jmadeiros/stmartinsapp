-- Get user's organizations from user_profiles table
-- Uses organization_id from user_profiles instead of a separate memberships table
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
