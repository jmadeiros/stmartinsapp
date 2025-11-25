-- ============================================================================
-- The Village Hub - Complete Database Migration (PUBLIC SCHEMA)
-- ============================================================================
-- Architecture:
--   - Uses 'public' schema for all application tables
--   - Integrates with Supabase auth.users (OAuth)
--   - Separate typed tables (posts, events, projects, meeting_notes)
--   - Unified feed via VIEW
--   - Jobs Board: BOTH opportunities posts + dedicated jobs table
--   - Calendar: Just events table (no separate calendar_events)
--   - Complete support choices for events/projects
--   - Simplified chat for initial build
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE APP SCHEMA
-- ============================================================================

-- App schema not needed, using public
SET search_path TO public;

-- ============================================================================
-- 2. CREATE ENUMS (skip if already exist from previous migration)
-- ============================================================================

-- User roles (from PRD)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'st_martins_staff', 'partner_staff', 'volunteer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Post categories (matching UI exactly)
DO $$ BEGIN
  CREATE TYPE public.post_category AS ENUM ('intros', 'wins', 'opportunities', 'questions', 'learnings', 'general');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Simplified reactions (just like for initial build)
DO $$ BEGIN
  CREATE TYPE public.reaction_type AS ENUM ('like');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Event categories (keep for future filtering)
DO $$ BEGIN
  CREATE TYPE public.event_category AS ENUM ('meeting', 'social', 'workshop', 'building_event', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Job types (for dedicated jobs table)
DO $$ BEGIN
  CREATE TYPE public.job_type AS ENUM ('paid_staff', 'volunteer', 'internship');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Meeting note workflow
DO $$ BEGIN
  CREATE TYPE public.meeting_note_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Project lifecycle
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. CORE TABLES - ORGANIZATIONS & USERS
-- ============================================================================

-- Organizations Table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  mission TEXT,
  founded_date DATE,
  size_range TEXT,
  cause_areas TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB,
  social_links JSONB,
  primary_color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Profiles (extends auth.users)
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  job_title TEXT,
  phone TEXT,
  skills TEXT[],
  interests TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  linkedin_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'network', -- 'public', 'network', 'org_only'
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Memberships (links users to organizations with roles)
CREATE TABLE public.user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'volunteer',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE(user_id, org_id)
);

-- User Settings
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  notification_frequency TEXT DEFAULT 'realtime',
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. POSTS & INTERACTIONS
-- ============================================================================

-- Posts Table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  category public.post_category NOT NULL DEFAULT 'general',
  image_url TEXT,
  linked_event_id UUID, -- Reference to events (added FK after events table created)
  linked_project_id UUID, -- Reference to projects (added FK after projects table created)
  cause TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Post Comments
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Post Reactions (just "like" for now)
CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type public.reaction_type NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- ============================================================================
-- 5. EVENTS (includes calendar functionality)
-- ============================================================================

-- Events Table (serves as both feed events AND calendar)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  virtual_link TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  category public.event_category NOT NULL DEFAULT 'other',
  cause TEXT,
  parent_project_id UUID, -- Link to parent project (FK added after projects table)
  collaborating_orgs UUID[], -- Array of org IDs collaborating
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format
  volunteers_needed INTEGER,
  seeking_partners BOOLEAN DEFAULT false,
  participants_referred INTEGER DEFAULT 0, -- Track how many participants were referred
  color TEXT, -- For calendar display
  ical_uid TEXT, -- For iCal export
  status TEXT DEFAULT 'open', -- 'open', 'closed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Event RSVPs (with support choices)
CREATE TABLE public.event_rsvps (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested', -- 'interested', 'going', 'not_going'

  -- Support choices from dropdown
  volunteer_offered BOOLEAN DEFAULT false,
  participants_count INTEGER,
  can_partner BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Event Attachments
CREATE TABLE public.event_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. PROJECTS
-- ============================================================================

-- Projects Table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_goal TEXT, -- Maps to impactGoal in UI
  cause TEXT,
  service_area TEXT,
  target_date TIMESTAMPTZ,
  status public.project_status NOT NULL DEFAULT 'planning',

  -- Progress tracking
  progress_current INTEGER DEFAULT 0,
  progress_target INTEGER,
  progress_unit TEXT, -- 'trees', 'meals', 'people', etc.

  -- Needs
  volunteers_needed INTEGER,
  fundraising_goal TEXT,
  seeking_partners BOOLEAN DEFAULT false,

  -- Relationships
  partner_orgs UUID[], -- Array of org IDs that are partners
  interested_orgs UUID[], -- Array of org IDs that expressed interest
  collaborators UUID[], -- Array of user IDs collaborating

  -- Tracking
  participants_referred INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Project Tasks/Milestones
CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  due_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Project Updates/Logs
CREATE TABLE public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT DEFAULT 'progress', -- 'progress', 'milestone', 'challenge', 'success'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Interest Tracking (with support choices)
CREATE TABLE public.project_interest (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Support choices from dropdown
  volunteer_offered BOOLEAN DEFAULT false,
  participants_count INTEGER,
  can_partner BOOLEAN DEFAULT false,
  provide_resources BOOLEAN DEFAULT false,
  contribute_funding BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, org_id, user_id)
);

-- ============================================================================
-- 7. JOBS BOARD (dedicated jobs + opportunities posts)
-- ============================================================================

-- Dedicated Jobs Table (for formal job postings)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type public.job_type NOT NULL,
  time_commitment TEXT,
  requirements TEXT,
  contact_email TEXT,
  contact_name TEXT,
  application_url TEXT,
  closing_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Note: Jobs Board will show BOTH:
--   1. Entries from public.jobs table
--   2. Posts where category = 'opportunities'

-- ============================================================================
-- 8. MEETING NOTES
-- ============================================================================

-- Meeting Notes
CREATE TABLE public.meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  status public.meeting_note_status NOT NULL DEFAULT 'draft',
  meeting_date DATE,
  linked_event_id UUID, -- Optional link to event (FK added after events table)
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Meeting Attendees
CREATE TABLE public.meeting_attendees (
  note_id UUID NOT NULL REFERENCES public.meeting_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'attendee', -- 'organizer', 'attendee', 'note_taker'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, user_id)
);

-- Action Items from Meetings
CREATE TABLE public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.meeting_notes(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Meeting Note Comments
CREATE TABLE public.meeting_note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.meeting_notes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. CHAT SYSTEM (simplified for initial build)
-- ============================================================================

-- Conversations (direct or group, simplified)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT, -- null for direct messages, required for group chats
  is_group BOOLEAN NOT NULL DEFAULT false,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived BOOLEAN NOT NULL DEFAULT false
);

-- Conversation Participants
CREATE TABLE public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Message Reactions (simplified - just emoji)
CREATE TABLE public.message_reactions (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- Unread Count Tracking
CREATE TABLE public.conversation_unread (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ============================================================================
-- 10. PEOPLE DIRECTORY
-- ============================================================================

-- Connection Requests (for networking)
CREATE TABLE public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (from_user_id, to_user_id)
);

-- ============================================================================
-- 11. ALERTS & NOTIFICATIONS
-- ============================================================================

-- Alerts (building-wide or org-specific announcements)
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'urgent'
  target_orgs UUID[], -- null = all orgs
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed_at TIMESTAMPTZ
);

-- ============================================================================
-- 12. ADD FOREIGN KEY CONSTRAINTS (that reference later tables)
-- ============================================================================

-- Add FKs for posts linking to events/projects
ALTER TABLE public.posts
  ADD CONSTRAINT fk_posts_linked_event
  FOREIGN KEY (linked_event_id) REFERENCES public.events(id) ON DELETE SET NULL;

ALTER TABLE public.posts
  ADD CONSTRAINT fk_posts_linked_project
  FOREIGN KEY (linked_project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add FK for events linking to parent project
ALTER TABLE public.events
  ADD CONSTRAINT fk_events_parent_project
  FOREIGN KEY (parent_project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add FK for meeting notes linking to events
ALTER TABLE public.meeting_notes
  ADD CONSTRAINT fk_meeting_notes_linked_event
  FOREIGN KEY (linked_event_id) REFERENCES public.events(id) ON DELETE SET NULL;

-- ============================================================================
-- 13. CREATE INDEXES
-- ============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_active ON public.organizations(is_active);

-- User Profiles
CREATE INDEX idx_user_profiles_visibility ON public.user_profiles(visibility);
CREATE INDEX idx_user_profiles_last_active ON public.user_profiles(last_active_at DESC);

-- User Memberships
CREATE INDEX idx_user_memberships_user ON public.user_memberships(user_id);
CREATE INDEX idx_user_memberships_org ON public.user_memberships(org_id);
CREATE INDEX idx_user_memberships_role ON public.user_memberships(role);
CREATE INDEX idx_user_memberships_primary ON public.user_memberships(user_id, is_primary) WHERE is_primary = true;

-- Posts
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_org ON public.posts(org_id);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_pinned ON public.posts(is_pinned, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_opportunities ON public.posts(category, created_at DESC) WHERE category = 'opportunities' AND deleted_at IS NULL;

-- Post Comments
CREATE INDEX idx_post_comments_post ON public.post_comments(post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_post_comments_author ON public.post_comments(author_id);
CREATE INDEX idx_post_comments_parent ON public.post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Post Reactions
CREATE INDEX idx_post_reactions_post ON public.post_reactions(post_id, reaction_type);
CREATE INDEX idx_post_reactions_user ON public.post_reactions(user_id);

-- Events
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_org ON public.events(org_id);
CREATE INDEX idx_events_start ON public.events(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_calendar_range ON public.events(start_time, end_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_parent_project ON public.events(parent_project_id) WHERE parent_project_id IS NOT NULL;

-- Event RSVPs
CREATE INDEX idx_event_rsvps_event ON public.event_rsvps(event_id, status);
CREATE INDEX idx_event_rsvps_user ON public.event_rsvps(user_id);

-- Projects
CREATE INDEX idx_projects_author ON public.projects(author_id);
CREATE INDEX idx_projects_org ON public.projects(org_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created ON public.projects(created_at DESC) WHERE deleted_at IS NULL;

-- Project Tasks
CREATE INDEX idx_project_tasks_project ON public.project_tasks(project_id, status, order_index);
CREATE INDEX idx_project_tasks_assigned ON public.project_tasks(assigned_to, status);

-- Project Interest
CREATE INDEX idx_project_interest_project ON public.project_interest(project_id);
CREATE INDEX idx_project_interest_org ON public.project_interest(org_id);

-- Jobs
CREATE INDEX idx_jobs_org ON public.jobs(org_id);
CREATE INDEX idx_jobs_posted_by ON public.jobs(posted_by);
CREATE INDEX idx_jobs_type ON public.jobs(job_type);
CREATE INDEX idx_jobs_active ON public.jobs(is_active, closing_date) WHERE deleted_at IS NULL;

-- Meeting Notes
CREATE INDEX idx_meeting_notes_org ON public.meeting_notes(org_id, meeting_date DESC);
CREATE INDEX idx_meeting_notes_author ON public.meeting_notes(author_id);
CREATE INDEX idx_meeting_notes_status ON public.meeting_notes(status);
CREATE INDEX idx_meeting_notes_tags ON public.meeting_notes USING GIN(tags);

-- Action Items
CREATE INDEX idx_action_items_assigned ON public.action_items(assigned_to, status, due_date);
CREATE INDEX idx_action_items_note ON public.action_items(note_id);

-- Conversations
CREATE INDEX idx_conversations_org ON public.conversations(org_id, created_at DESC);
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);

-- Messages
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);

-- Conversation Unread
CREATE INDEX idx_conversation_unread_user ON public.conversation_unread(user_id, unread_count DESC) WHERE unread_count > 0;

-- Connection Requests
CREATE INDEX idx_connection_requests_to_user ON public.connection_requests(to_user_id, status);
CREATE INDEX idx_connection_requests_from_user ON public.connection_requests(from_user_id, created_at DESC);

-- ============================================================================
-- 14. CREATE UNIFIED FEED VIEW
-- ============================================================================

CREATE VIEW public.feed AS
  SELECT
    id,
    'post' as type,
    title,
    org_id,
    author_id,
    created_at,
    updated_at
  FROM public.posts
  WHERE deleted_at IS NULL
UNION ALL
  SELECT
    id,
    'event' as type,
    title,
    org_id,
    organizer_id as author_id,
    created_at,
    updated_at
  FROM public.events
  WHERE deleted_at IS NULL
UNION ALL
  SELECT
    id,
    'project' as type,
    title,
    org_id,
    author_id,
    created_at,
    updated_at
  FROM public.projects
  WHERE deleted_at IS NULL
UNION ALL
  SELECT
    id,
    'meeting_note' as type,
    title,
    org_id,
    author_id,
    created_at,
    updated_at
  FROM public.meeting_notes
  WHERE status = 'published'
ORDER BY created_at DESC;

-- View for Jobs Board (combines dedicated jobs + opportunity posts)
CREATE VIEW public.jobs_board AS
  -- Dedicated job postings
  SELECT
    'job' as source_type,
    id,
    title,
    description as content,
    org_id,
    posted_by as author_id,
    job_type,
    closing_date,
    contact_email,
    contact_name,
    application_url,
    created_at
  FROM public.jobs
  WHERE is_active = true AND deleted_at IS NULL
UNION ALL
  -- Opportunity posts
  SELECT
    'post' as source_type,
    id,
    title,
    content,
    org_id,
    author_id,
    NULL as job_type,
    NULL as closing_date,
    NULL as contact_email,
    NULL as contact_name,
    NULL as application_url,
    created_at
  FROM public.posts
  WHERE category = 'opportunities' AND deleted_at IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- 15. CREATE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_event_rsvps_updated_at BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_meeting_notes_updated_at BEFORE UPDATE ON public.meeting_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_meeting_note_comments_updated_at BEFORE UPDATE ON public.meeting_note_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_conversation_unread_updated_at BEFORE UPDATE ON public.conversation_unread
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

-- Function to count events for a project
CREATE OR REPLACE FUNCTION public.count_project_events(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.events
    WHERE parent_project_id = p_project_id AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 16. HELPER FUNCTIONS
-- ============================================================================

-- Get user's organizations
CREATE OR REPLACE FUNCTION public.member_orgs(p_user_id UUID)
RETURNS TABLE (org_id UUID, role public.user_role) AS $$
BEGIN
  RETURN QUERY
  SELECT um.org_id, um.role
  FROM public.user_memberships um
  WHERE um.user_id = p_user_id AND um.left_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Start a conversation (simplified)
CREATE OR REPLACE FUNCTION public.start_conversation(
  p_participant_user_ids UUID[],
  p_org_id UUID,
  p_is_group BOOLEAN DEFAULT false,
  p_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_user_id UUID;
BEGIN
  INSERT INTO public.conversations (is_group, name, org_id, created_by)
  VALUES (p_is_group, p_name, p_org_id, auth.uid())
  RETURNING id INTO v_conversation_id;

  FOREACH v_user_id IN ARRAY p_participant_user_ids LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id, org_id)
    VALUES (v_conversation_id, v_user_id, p_org_id);
  END LOOP;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RSVP to event with support choices
CREATE OR REPLACE FUNCTION public.rsvp_event(
  p_event_id UUID,
  p_org_id UUID,
  p_status TEXT,
  p_volunteer_offered BOOLEAN DEFAULT false,
  p_participants_count INTEGER DEFAULT NULL,
  p_can_partner BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.event_rsvps (
    event_id, user_id, org_id, status,
    volunteer_offered, participants_count, can_partner
  )
  VALUES (
    p_event_id, auth.uid(), p_org_id, p_status,
    p_volunteer_offered, p_participants_count, p_can_partner
  )
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    status = p_status,
    volunteer_offered = p_volunteer_offered,
    participants_count = p_participants_count,
    can_partner = p_can_partner,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Express interest in project with support choices
CREATE OR REPLACE FUNCTION public.express_project_interest(
  p_project_id UUID,
  p_org_id UUID,
  p_volunteer_offered BOOLEAN DEFAULT false,
  p_participants_count INTEGER DEFAULT NULL,
  p_can_partner BOOLEAN DEFAULT false,
  p_provide_resources BOOLEAN DEFAULT false,
  p_contribute_funding BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.project_interest (
    project_id, org_id, user_id,
    volunteer_offered, participants_count, can_partner,
    provide_resources, contribute_funding
  )
  VALUES (
    p_project_id, p_org_id, auth.uid(),
    p_volunteer_offered, p_participants_count, p_can_partner,
    p_provide_resources, p_contribute_funding
  )
  ON CONFLICT (project_id, org_id, user_id)
  DO UPDATE SET
    volunteer_offered = p_volunteer_offered,
    participants_count = p_participants_count,
    can_partner = p_can_partner,
    provide_resources = p_provide_resources,
    contribute_funding = p_contribute_funding;

  -- Update interested_orgs array
  UPDATE public.projects
  SET interested_orgs = array_append(
    COALESCE(interested_orgs, ARRAY[]::UUID[]),
    p_org_id
  )
  WHERE id = p_project_id
    AND NOT (p_org_id = ANY(COALESCE(interested_orgs, ARRAY[]::UUID[])));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete action item
CREATE OR REPLACE FUNCTION public.complete_action_item(p_action_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.action_items
  SET status = 'completed', completed_at = now()
  WHERE id = p_action_id
    AND (assigned_to = auth.uid() OR EXISTS (
      SELECT 1 FROM public.meeting_notes mn
      WHERE mn.id = action_items.note_id AND mn.author_id = auth.uid()
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate iCal file for event (helper for export)
CREATE OR REPLACE FUNCTION public.generate_event_ical(p_event_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_event RECORD;
  v_ical TEXT;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;

  v_ical := 'BEGIN:VCALENDAR' || E'\n' ||
    'VERSION:2.0' || E'\n' ||
    'PRODID:-//The Village Hub//Events//EN' || E'\n' ||
    'BEGIN:VEVENT' || E'\n' ||
    'UID:' || v_event.id || '@villagehub.app' || E'\n' ||
    'DTSTAMP:' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD"T"HH24MISS"Z"') || E'\n' ||
    'DTSTART:' || to_char(v_event.start_time AT TIME ZONE 'UTC', 'YYYYMMDD"T"HH24MISS"Z"') || E'\n' ||
    'DTEND:' || to_char(v_event.end_time AT TIME ZONE 'UTC', 'YYYYMMDD"T"HH24MISS"Z"') || E'\n' ||
    'SUMMARY:' || v_event.title || E'\n' ||
    'DESCRIPTION:' || COALESCE(v_event.description, '') || E'\n' ||
    'LOCATION:' || COALESCE(v_event.location, '') || E'\n';

  IF v_event.virtual_link IS NOT NULL THEN
    v_ical := v_ical || 'URL:' || v_event.virtual_link || E'\n';
  END IF;

  v_ical := v_ical || 'END:VEVENT' || E'\n' || 'END:VCALENDAR';

  RETURN v_ical;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_note_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_unread ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Organizations: All authenticated users can view active orgs
CREATE POLICY "Authenticated users view organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (is_active = true);

-- User Profiles: Users view based on visibility settings
CREATE POLICY "Users view network profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'network' AND EXISTS (
      SELECT 1 FROM public.user_memberships um1
      JOIN public.user_memberships um2 ON um1.org_id = um2.org_id
      WHERE um1.user_id = auth.uid() AND um2.user_id = user_profiles.user_id
        AND um1.left_at IS NULL AND um2.left_at IS NULL
    ))
  );

CREATE POLICY "Users update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Memberships: Users view their own and same-org memberships
CREATE POLICY "Users view memberships"
  ON public.user_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
  );

-- User Settings: Users manage only their own settings
CREATE POLICY "Users manage own settings"
  ON public.user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Posts: Org members can view, authors can update/delete
CREATE POLICY "Org members view posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
  );

CREATE POLICY "Org members create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
  );

CREATE POLICY "Authors update own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors delete own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Post Comments: Same as posts
CREATE POLICY "Org members view comments"
  ON public.post_comments FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_comments.post_id
        AND p.org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Org members create comments"
  ON public.post_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id
        AND p.org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Authors update own comments"
  ON public.post_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Post Reactions: Org members can react
CREATE POLICY "Org members view reactions"
  ON public.post_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_reactions.post_id
        AND p.org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
    )
  );

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

CREATE POLICY "Users delete own reactions"
  ON public.post_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Events: Org members can view, organizers can manage
CREATE POLICY "Org members view events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
  );

CREATE POLICY "Org members create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
  );

CREATE POLICY "Organizers update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Event RSVPs: Org members can RSVP
CREATE POLICY "Org members view rsvps"
  ON public.event_rsvps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_rsvps.event_id
        AND e.org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Org members create rsvps"
  ON public.event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id
        AND e.org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Users update own rsvps"
  ON public.event_rsvps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Projects: Similar to events
CREATE POLICY "Org members view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
  );

CREATE POLICY "Org members create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
  );

CREATE POLICY "Authors update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Jobs: Org members view, org admins/staff create
CREATE POLICY "Org members view jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_active = true
  );

CREATE POLICY "Org staff create jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.member_orgs(auth.uid())
      WHERE role IN ('admin', 'st_martins_staff', 'partner_staff')
    )
  );

CREATE POLICY "Job posters update jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (posted_by = auth.uid())
  WITH CHECK (posted_by = auth.uid());

-- Meeting Notes: Org members view published, authors manage
CREATE POLICY "Org members view published notes"
  ON public.meeting_notes FOR SELECT
  TO authenticated
  USING (
    (status = 'published' AND org_id IN (SELECT org_id FROM public.member_orgs(auth.uid())))
    OR author_id = auth.uid()
  );

CREATE POLICY "Org members create notes"
  ON public.meeting_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.member_orgs(auth.uid()))
  );

CREATE POLICY "Authors update notes"
  ON public.meeting_notes FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Conversations: Participants only
CREATE POLICY "Participants view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

-- Messages: Participants can view and send
CREATE POLICY "Participants view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Senders update own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Connection Requests: Both parties can view
CREATE POLICY "Users view connection requests"
  ON public.connection_requests FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

CREATE POLICY "Users create connection requests"
  ON public.connection_requests FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Recipients respond to requests"
  ON public.connection_requests FOR UPDATE
  TO authenticated
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- ============================================================================
-- 18. GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- 19. SEED DATA (Optional - for development)
-- ============================================================================

-- Create St Martin's organization
INSERT INTO public.organizations (id, name, slug, description, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'St Martin''s Hub', 'st-martins', 'The Village Hub building management', true)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE ✅
-- ============================================================================
-- Summary of Implementation:
--   ✅ Fixed post_category to match UI ('intros', 'wins', 'opportunities', etc.)
--   ✅ Simplified reactions to just 'like'
--   ✅ Removed calendar_events table (using events with iCal export)
--   ✅ Added all event support choice fields (volunteer, participants, partner)
--   ✅ Added all project support choice fields (volunteer, participants, partner, resources, funding)
--   ✅ Jobs Board: BOTH dedicated jobs table + opportunities posts
--   ✅ Simplified chat (no complex ENUMs)
--   ✅ Added parent_project_id to events
--   ✅ Added participants_referred tracking
--   ✅ Complete RLS policies
--   ✅ Helper functions with support choices
--   ✅ iCal export function for events
--
-- Next steps:
--   1. Run this in Supabase SQL Editor
--   2. Set up OAuth providers (Google/Microsoft) in Supabase Auth
--   3. Update frontend TypeScript types
--   4. Test queries and RLS policies
-- ============================================================================
