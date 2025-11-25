-- ============================================================================
-- Cleanup: Remove user_memberships table and simplify to single-org model
-- ============================================================================
-- This drops the user_memberships table and adds organization_id + role
-- directly to user_profiles for simpler single-organization membership
-- ============================================================================

BEGIN;

-- 1. Add organization_id and role columns to user_profiles (if they don't exist)
DO $$
BEGIN
  -- Add organization_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;

  -- Add role column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD COLUMN role public.user_role NOT NULL DEFAULT 'volunteer';
  END IF;
END $$;

-- 2. Migrate data from user_memberships to user_profiles (if user_memberships exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_memberships'
  ) THEN
    -- Copy org_id and role from user_memberships to user_profiles
    UPDATE public.user_profiles up
    SET
      organization_id = um.org_id,
      role = um.role
    FROM public.user_memberships um
    WHERE up.user_id = um.user_id
    AND um.is_primary = true;  -- Only migrate primary membership

    RAISE NOTICE 'Migrated data from user_memberships to user_profiles';
  END IF;
END $$;

-- 3. Drop user_memberships table (if it exists)
DROP TABLE IF EXISTS public.user_memberships CASCADE;

-- 4. Create index on organization_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization
  ON public.user_profiles(organization_id)
  WHERE organization_id IS NOT NULL;

-- 5. Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_role
  ON public.user_profiles(role);

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check that user_profiles now has organization_id and role columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('organization_id', 'role')
ORDER BY column_name;
