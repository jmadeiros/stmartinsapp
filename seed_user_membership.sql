-- Add test user to test organization as admin
-- Run this after creating user_memberships table

INSERT INTO public.user_memberships (user_id, org_id, role, is_primary)
SELECT
  (SELECT id FROM auth.users WHERE email = 'test@stmartins.dev' LIMIT 1),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin',
  true
ON CONFLICT (user_id, org_id, left_at) DO NOTHING;
