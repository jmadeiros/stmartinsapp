-- Create user_memberships table
-- This tracks which users belong to which organizations and their roles

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('admin', 'st_martins_staff', 'partner_staff', 'volunteer')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,

  CONSTRAINT unique_active_membership UNIQUE (user_id, org_id, left_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_org ON public.user_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_active ON public.user_memberships(user_id, org_id) WHERE left_at IS NULL;

COMMIT;
