-- Update test user profile with organization (using user_profiles instead of user_memberships)
-- Note: The dev-login endpoint now creates users with organization_id directly in user_profiles
-- This migration is kept for backwards compatibility with any existing test@stmartins.dev user
UPDATE public.user_profiles
SET
  organization_id = '00000000-0000-0000-0000-000000000001'::uuid,
  role = 'admin'::public.user_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@stmartins.dev' LIMIT 1)
  AND organization_id IS NULL;
