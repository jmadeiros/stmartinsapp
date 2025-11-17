-- Migration: Homepage Social Feed Schema Updates
-- Description: Adds Projects table, modifies Posts and Events for new content type system
-- Date: 2025-11-17

-- ============================================================================
-- 1. UPDATE ENUMS FOR NEW CONTENT TYPES
-- ============================================================================

-- Drop old post_category enum if exists and create new one
DO $$ BEGIN
    -- Drop dependent objects
    ALTER TABLE IF EXISTS posts DROP CONSTRAINT IF EXISTS posts_category_check;
    DROP TYPE IF EXISTS post_category CASCADE;

    -- Create new enum with 6 categories for posts
    CREATE TYPE post_category AS ENUM (
        'intros',       -- Team member introductions
        'wins',         -- Celebrating successes
        'opportunities',-- Collaboration opportunities
        'questions',    -- Community questions
        'learnings',    -- Insights and lessons
        'general'       -- Everything else
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. MODIFY POSTS TABLE
-- ============================================================================

-- Add new columns to posts table
ALTER TABLE posts
    -- Make title optional (posts can be content-only)
    ALTER COLUMN title DROP NOT NULL,

    -- Change category to new enum type
    ALTER COLUMN category TYPE VARCHAR(50),  -- Temporarily change to varchar
    ALTER COLUMN category DROP NOT NULL,     -- Make optional

    -- Add linking columns
    ADD COLUMN IF NOT EXISTS linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS linked_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Add image support
    ADD COLUMN IF NOT EXISTS image_url TEXT,

    -- Add engagement metrics
    ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

-- Update category column to new enum
ALTER TABLE posts
    ALTER COLUMN category TYPE post_category USING category::post_category;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_posts_linked_event ON posts(linked_event_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_linked_project ON posts(linked_project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_engagement ON posts(likes_count DESC, comments_count DESC) WHERE deleted_at IS NULL;

-- Update comments
COMMENT ON COLUMN posts.category IS 'Post category: intros, wins, opportunities, questions, learnings, or general (optional)';
COMMENT ON COLUMN posts.linked_event_id IS 'Optional reference to related event';
COMMENT ON COLUMN posts.linked_project_id IS 'Optional reference to related project';

-- ============================================================================
-- 3. MODIFY EVENTS TABLE
-- ============================================================================

-- Add new columns to events table for collaboration features
ALTER TABLE events
    -- Add cause tagging
    ADD COLUMN IF NOT EXISTS cause VARCHAR(100),

    -- Add parent project relationship
    ADD COLUMN IF NOT EXISTS parent_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Add needs as JSONB for flexibility
    ADD COLUMN IF NOT EXISTS needs JSONB DEFAULT '{}',

    -- Add collaborating organizations as array
    ADD COLUMN IF NOT EXISTS collaborating_org_ids UUID[],

    -- Add status
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),

    -- Add engagement tracking
    ADD COLUMN IF NOT EXISTS interested_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS participants_referred INTEGER NOT NULL DEFAULT 0;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_events_parent_project ON events(parent_project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_cause ON events(cause) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_collaborating_orgs ON events USING GIN(collaborating_org_ids);

-- Update comments
COMMENT ON COLUMN events.cause IS 'Optional cause tag (e.g., "Food Security", "Youth Education")';
COMMENT ON COLUMN events.parent_project_id IS 'Optional reference to parent project this event is part of';
COMMENT ON COLUMN events.needs IS 'JSONB object with volunteersNeeded, participantRequests, seekingPartners, etc.';
COMMENT ON COLUMN events.collaborating_org_ids IS 'Array of organization IDs collaborating on this event';
COMMENT ON COLUMN events.status IS 'Event status: open (accepting signups) or closed';

-- ============================================================================
-- 4. CREATE PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Core fields
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    impact_goal TEXT NOT NULL CHECK (char_length(impact_goal) >= 20), -- Required, min 20 chars

    -- Optional metadata
    target_date TIMESTAMP WITH TIME ZONE, -- NULL means "Ongoing"
    service_area VARCHAR(200),  -- e.g., "East London", "Building-wide"
    cause VARCHAR(100),         -- e.g., "Food Security"

    -- Collaboration
    collaborating_org_ids UUID[], -- Array of organization IDs

    -- Needs (JSONB for flexibility)
    needs JSONB DEFAULT '{}',

    -- Progress tracking (optional)
    progress_current INTEGER,
    progress_target INTEGER,
    progress_unit VARCHAR(50), -- e.g., "trees planted", "USD raised"
    progress_updated_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),

    -- Engagement tracking
    interested_count INTEGER NOT NULL DEFAULT 0,
    participants_referred INTEGER NOT NULL DEFAULT 0,
    events_count INTEGER NOT NULL DEFAULT 0, -- Count of linked events

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for projects
CREATE INDEX idx_projects_author ON projects(author_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_cause ON projects(cause) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_target_date ON projects(target_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_created ON projects(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_collaborating_orgs ON projects USING GIN(collaborating_org_ids);
CREATE INDEX idx_projects_engagement ON projects(interested_count DESC, participants_referred DESC) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE projects IS 'Long-term collaborative initiatives and programs';
COMMENT ON COLUMN projects.impact_goal IS 'Clear statement of intended impact (required, min 20 chars)';
COMMENT ON COLUMN projects.target_date IS 'Target completion date (NULL for ongoing projects)';
COMMENT ON COLUMN projects.needs IS 'JSONB object with volunteersNeeded, participantRequests, resourcesRequested, fundraisingGoal, seekingPartners';
COMMENT ON COLUMN projects.progress_current IS 'Current progress value (e.g., 650 for "650 trees planted")';
COMMENT ON COLUMN projects.progress_target IS 'Target progress value (e.g., 1000 for "1000 trees")';
COMMENT ON COLUMN projects.progress_unit IS 'Unit of measurement (e.g., "trees", "families served", "USD")';
COMMENT ON COLUMN projects.events_count IS 'Cached count of events linked to this project';

-- ============================================================================
-- 5. CREATE INTEREST TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Polymorphic reference (content can be event or project)
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('event', 'project')),
    content_id UUID NOT NULL,

    -- Support commitments (what they offered to help with)
    will_volunteer BOOLEAN DEFAULT false,
    participants_count INTEGER,
    resources_offered TEXT[], -- Array of resources they can provide
    funding_offered BOOLEAN DEFAULT false,
    wants_to_partner BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Ensure one interest per org per content item
    UNIQUE(organization_id, content_type, content_id)
);

-- Indexes
CREATE INDEX idx_content_interests_user ON content_interests(user_id);
CREATE INDEX idx_content_interests_org ON content_interests(organization_id);
CREATE INDEX idx_content_interests_content ON content_interests(content_type, content_id);

-- Comments
COMMENT ON TABLE content_interests IS 'Tracks which organizations/users are interested in events/projects';
COMMENT ON COLUMN content_interests.content_type IS 'Type of content: event or project';
COMMENT ON COLUMN content_interests.content_id IS 'UUID of the event or project';
COMMENT ON COLUMN content_interests.will_volunteer IS 'User committed to volunteer';
COMMENT ON COLUMN content_interests.participants_count IS 'Number of participants user committed to bring';
COMMENT ON COLUMN content_interests.resources_offered IS 'Array of resource names user can provide';

-- ============================================================================
-- 6. CREATE SUPPORT COMMITMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Reference to event or project
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('event', 'project')),
    content_id UUID NOT NULL,

    -- What kind of support
    commitment_type VARCHAR(50) NOT NULL CHECK (commitment_type IN (
        'volunteer',
        'participants',
        'resources',
        'funding',
        'partnership'
    )),

    -- Details
    quantity INTEGER, -- For volunteers count, participants count, etc.
    details TEXT,     -- For resource names, funding amount, etc.

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'fulfilled', 'cancelled')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_support_commitments_user ON support_commitments(user_id);
CREATE INDEX idx_support_commitments_org ON support_commitments(organization_id);
CREATE INDEX idx_support_commitments_content ON support_commitments(content_type, content_id);
CREATE INDEX idx_support_commitments_type ON support_commitments(commitment_type);
CREATE INDEX idx_support_commitments_status ON support_commitments(status);

-- Comments
COMMENT ON TABLE support_commitments IS 'Tracks specific support commitments (volunteers, resources, etc.)';
COMMENT ON COLUMN support_commitments.commitment_type IS 'Type: volunteer, participants, resources, funding, or partnership';
COMMENT ON COLUMN support_commitments.quantity IS 'Numeric quantity (volunteer count, participants, etc.)';
COMMENT ON COLUMN support_commitments.details IS 'Additional details (resource names, funding amounts, etc.)';

-- ============================================================================
-- 7. CREATE TRIGGERS FOR DENORMALIZED COUNTS
-- ============================================================================

-- Function to update events_count on projects
CREATE OR REPLACE FUNCTION update_project_events_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.parent_project_id IS NOT NULL THEN
        UPDATE projects
        SET events_count = (
            SELECT COUNT(*)
            FROM events
            WHERE parent_project_id = NEW.parent_project_id
            AND deleted_at IS NULL
        )
        WHERE id = NEW.parent_project_id;
    END IF;

    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND OLD.parent_project_id IS NOT NULL THEN
        UPDATE projects
        SET events_count = (
            SELECT COUNT(*)
            FROM events
            WHERE parent_project_id = OLD.parent_project_id
            AND deleted_at IS NULL
        )
        WHERE id = OLD.parent_project_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for events_count
DROP TRIGGER IF EXISTS trigger_update_project_events_count ON events;
CREATE TRIGGER trigger_update_project_events_count
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW
EXECUTE FUNCTION update_project_events_count();

-- Function to update interested_count
CREATE OR REPLACE FUNCTION update_content_interested_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.content_type = 'event' THEN
            UPDATE events SET interested_count = interested_count + 1 WHERE id = NEW.content_id;
        ELSIF NEW.content_type = 'project' THEN
            UPDATE projects SET interested_count = interested_count + 1 WHERE id = NEW.content_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.content_type = 'event' THEN
            UPDATE events SET interested_count = GREATEST(interested_count - 1, 0) WHERE id = OLD.content_id;
        ELSIF OLD.content_type = 'project' THEN
            UPDATE projects SET interested_count = GREATEST(interested_count - 1, 0) WHERE id = OLD.content_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for interested_count
DROP TRIGGER IF EXISTS trigger_update_content_interested_count ON content_interests;
CREATE TRIGGER trigger_update_content_interested_count
AFTER INSERT OR DELETE ON content_interests
FOR EACH ROW
EXECUTE FUNCTION update_content_interested_count();

-- Function to update likes_count and comments_count on posts
CREATE OR REPLACE FUNCTION update_post_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'post_reactions' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for post engagement
DROP TRIGGER IF EXISTS trigger_update_post_likes ON post_reactions;
CREATE TRIGGER trigger_update_post_likes
AFTER INSERT OR DELETE ON post_reactions
FOR EACH ROW
EXECUTE FUNCTION update_post_engagement_counts();

DROP TRIGGER IF EXISTS trigger_update_post_comments ON post_comments;
CREATE TRIGGER trigger_update_post_comments
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_engagement_counts();

-- ============================================================================
-- 8. CREATE UPDATED_AT TRIGGER FOR NEW TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON projects;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON support_commitments;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON support_commitments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. ADD RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_commitments ENABLE ROW LEVEL SECURITY;

-- Projects: Everyone can read, authenticated users can create
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON projects;
CREATE POLICY "Projects are viewable by everyone" ON projects
    FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = author_id);

-- Content interests: Users can manage their own
DROP POLICY IF EXISTS "Users can view all interests" ON content_interests;
CREATE POLICY "Users can view all interests" ON content_interests
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own interests" ON content_interests;
CREATE POLICY "Users can create their own interests" ON content_interests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own interests" ON content_interests;
CREATE POLICY "Users can delete their own interests" ON content_interests
    FOR DELETE USING (auth.uid() = user_id);

-- Support commitments: Similar to interests
DROP POLICY IF EXISTS "Users can view all commitments" ON support_commitments;
CREATE POLICY "Users can view all commitments" ON support_commitments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own commitments" ON support_commitments;
CREATE POLICY "Users can create their own commitments" ON support_commitments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own commitments" ON support_commitments;
CREATE POLICY "Users can update their own commitments" ON support_commitments
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add migration tracking
INSERT INTO schema_migrations (version, description, executed_at)
VALUES ('001', 'Homepage social feed schema updates', NOW())
ON CONFLICT (version) DO NOTHING;
