-- Create user_memberships table to track user-organization relationships
-- This table links auth.users to organizations with role assignments

-- First, check if the role enum exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'st_martins_staff', 'partner_staff', 'volunteer');
    END IF;
END $$;

-- Create the user_memberships table
CREATE TABLE IF NOT EXISTS public.user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'volunteer',
    is_primary BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ NULL,

    -- Ensure a user can only have one membership per org
    UNIQUE(user_id, org_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_org_id ON public.user_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_role ON public.user_memberships(role);

-- Enable RLS
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own memberships
CREATE POLICY "Users can view their own memberships"
    ON public.user_memberships
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can read memberships of their org members
CREATE POLICY "Users can view org member memberships"
    ON public.user_memberships
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.user_memberships WHERE user_id = auth.uid()
        )
    );

-- Only admins can insert/update/delete memberships
CREATE POLICY "Admins can manage memberships"
    ON public.user_memberships
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_memberships
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND org_id = user_memberships.org_id
        )
    );

-- Grant permissions
GRANT ALL ON public.user_memberships TO authenticated;
GRANT SELECT ON public.user_memberships TO anon;
