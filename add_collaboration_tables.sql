-- Add collaboration invitation and notification tables
-- Run this migration to add Phase 2 collaboration features

BEGIN;

-- ============================================================================
-- COLLABORATION INVITATIONS TABLE
-- ============================================================================
-- Tracks invitations to collaborate on events or projects
CREATE TABLE IF NOT EXISTS public.collaboration_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What is being collaborated on
  resource_type TEXT NOT NULL CHECK (resource_type IN ('event', 'project')),
  resource_id UUID NOT NULL,

  -- Who is inviting and who is being invited
  inviter_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Invitation status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

  -- Optional message from inviter
  message TEXT,

  -- Response tracking
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_invitation UNIQUE (resource_type, resource_id, invitee_org_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_invitee
  ON public.collaboration_invitations(invitee_org_id, status);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_resource
  ON public.collaboration_invitations(resource_type, resource_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
-- General notifications system for users
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who receives this notification
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Notification type and content
  type TEXT NOT NULL CHECK (type IN (
    'collaboration_invitation',
    'collaboration_request',
    'invitation_accepted',
    'invitation_declined',
    'event_reminder',
    'project_update',
    'mention',
    'comment',
    'reaction'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related resource (optional)
  resource_type TEXT CHECK (resource_type IN ('event', 'project', 'post', 'comment')),
  resource_id UUID,

  -- Action data (JSON for flexibility)
  action_url TEXT,
  action_data JSONB,

  -- Status
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Optional expiration (e.g., for event reminders)

  -- Constraints
  CHECK (
    (resource_type IS NULL AND resource_id IS NULL) OR
    (resource_type IS NOT NULL AND resource_id IS NOT NULL)
  )
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_resource
  ON public.notifications(resource_type, resource_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on collaboration_invitations
CREATE OR REPLACE FUNCTION update_collaboration_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS collaboration_invitations_updated_at ON public.collaboration_invitations;
CREATE TRIGGER collaboration_invitations_updated_at
  BEFORE UPDATE ON public.collaboration_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_collaboration_invitations_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get an admin/representative user for an org
-- Uses the organization_id in user_profiles (simplified schema)
CREATE OR REPLACE FUNCTION get_org_representative_user_id(target_org_id UUID)
RETURNS UUID AS $$
  SELECT user_id
  FROM public.user_profiles
  WHERE organization_id = target_org_id
    AND role = 'admin'
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to create notification for collaboration invitation
CREATE OR REPLACE FUNCTION notify_collaboration_invitation()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  inviter_org_name TEXT;
  inviter_user_name TEXT;
  resource_title TEXT;
BEGIN
  -- Only create notification for new pending invitations
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'pending' AND NEW.status = 'pending') THEN

    -- Get a representative user of the invitee org
    SELECT get_org_representative_user_id(NEW.invitee_org_id) INTO admin_user_id;

    IF admin_user_id IS NULL THEN
      RETURN NEW; -- No admin found, skip notification
    END IF;

    -- Get inviter details
    SELECT name INTO inviter_org_name
    FROM public.organizations
    WHERE id = NEW.inviter_org_id;

    SELECT full_name INTO inviter_user_name
    FROM public.user_profiles
    WHERE user_id = NEW.inviter_user_id;

    -- Get resource title
    IF NEW.resource_type = 'event' THEN
      SELECT title INTO resource_title FROM public.events WHERE id = NEW.resource_id;
    ELSIF NEW.resource_type = 'project' THEN
      SELECT title INTO resource_title FROM public.projects WHERE id = NEW.resource_id;
    END IF;

    -- Create notification
    INSERT INTO public.notifications (
      user_id,
      org_id,
      type,
      title,
      message,
      resource_type,
      resource_id,
      action_data
    ) VALUES (
      admin_user_id,
      NEW.invitee_org_id,
      'collaboration_invitation',
      'Collaboration Invitation',
      format('%s from %s invited your organization to collaborate on "%s"',
        inviter_user_name, inviter_org_name, resource_title),
      NEW.resource_type,
      NEW.resource_id,
      jsonb_build_object(
        'invitation_id', NEW.id,
        'inviter_org_id', NEW.inviter_org_id,
        'inviter_org_name', inviter_org_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification when invitation is created
DROP TRIGGER IF EXISTS collaboration_invitation_notify ON public.collaboration_invitations;
CREATE TRIGGER collaboration_invitation_notify
  AFTER INSERT OR UPDATE ON public.collaboration_invitations
  FOR EACH ROW
  EXECUTE FUNCTION notify_collaboration_invitation();

COMMIT;

-- ============================================================================
-- RLS POLICIES (Optional - disable for development)
-- ============================================================================

-- Uncomment these when ready for production RLS

-- ALTER TABLE public.collaboration_invitations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view invitations for their org"
--   ON public.collaboration_invitations FOR SELECT
--   USING (
--     invitee_org_id IN (
--       SELECT org_id FROM public.user_memberships WHERE user_id = auth.uid()
--     ) OR
--     inviter_org_id IN (
--       SELECT org_id FROM public.user_memberships WHERE user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can respond to invitations for their org"
--   ON public.collaboration_invitations FOR UPDATE
--   USING (
--     invitee_org_id IN (
--       SELECT org_id FROM public.user_memberships WHERE user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can view their notifications"
--   ON public.notifications FOR SELECT
--   USING (user_id = auth.uid());

-- CREATE POLICY "Users can mark their notifications as read"
--   ON public.notifications FOR UPDATE
--   USING (user_id = auth.uid());
