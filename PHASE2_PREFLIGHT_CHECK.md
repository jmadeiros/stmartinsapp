# Phase 2 Pre-flight Check

**Generated:** December 10, 2025

## Executive Summary

**SAFE TO PARALLELIZE?** YES - with conditions

The database schema is well-structured and contains the expected tables. However, there are several mock data locations that need to be replaced and some potential file conflicts to be aware of when running parallel agents.

---

## Database Tables Status

### Core Tables for Phase 2 Features

| Table | Exists? | Location | Notes |
|-------|---------|----------|-------|
| `post_reactions` | YES | `public.post_reactions` | Has `id`, `post_id`, `user_id`, `reaction_type`, `created_at`. FK to `posts`. |
| `post_comments` | YES | `public.post_comments` | Has `id`, `post_id`, `author_id`, `content`, `parent_comment_id`, `created_at`. Supports threaded comments. |
| `notifications` | NO | - | **DOES NOT EXIST** - needs to be created if notifications feature is planned |
| `user_profiles` | YES | `public.user_profiles` | Contains `user_id`, `full_name`, `organization_id`, `role`, etc. **Note:** This is `user_profiles` NOT `profiles` |
| `posts` | YES | `public.posts` | Full table with all expected columns |
| `events` | YES | `public.events` | Full table with all expected columns |
| `projects` | YES | `public.projects` | Full table with all expected columns |
| `alerts` | YES | `public.alerts` | For system alerts feature |

### Post Reactions Table Details
```typescript
post_reactions: {
  id: string
  post_id: string           // FK to posts
  user_id: string
  reaction_type: "like"     // Enum - currently only "like" is defined
  created_at: string
}
```

### Post Comments Table Details
```typescript
post_comments: {
  id: string
  post_id: string           // FK to posts
  author_id: string
  content: string
  parent_comment_id: string | null  // Supports threaded replies
  created_at: string
  updated_at: string
  deleted_at: string | null         // Soft delete support
}
```

### Available Enums
- `reaction_type`: `["like"]` - Only "like" reaction type exists currently
- `post_category`: `["intros", "wins", "opportunities", "questions", "learnings", "general"]`
- `user_role`: `["admin", "st_martins_staff", "partner_staff", "volunteer"]`
- `project_status`: `["planning", "active", "on_hold", "completed", "cancelled"]`
- `event_category`: `["meeting", "social", "workshop", "building_event", "other"]`

### Available Views
- `feed` - Unified feed view
- `opportunities` - Opportunity posts with comment/reaction counts
- `people` - User profiles with organization info and activity counts
- `calendar` - Events with RSVP counts
- `projects_view` - Projects with interest counts and progress

---

## Mock Data Locations to Remove

### High Priority (Blocking Feed Display)

| File | Lines | Description |
|------|-------|-------------|
| `/src/app/(authenticated)/dashboard/actions.ts` | 8-165 | `MOCK_FEED_ITEMS` - Large array of hardcoded feed items used as fallback |
| `/src/app/(authenticated)/dashboard/actions.ts` | 249-264 | `mockProfiles` - Fallback profile data when real profiles not found |
| `/src/app/(authenticated)/dashboard/actions.ts` | 394-398 | Fallback logic: `if (allItems.length === 0) return MOCK_FEED_ITEMS` |

### Medium Priority (UI Feature Placeholders)

| File | Lines | Description |
|------|-------|-------------|
| `/src/components/social/main-feed.tsx` | 32-36 | `existingEvents` - Hardcoded events for tag selector dropdown |
| `/src/components/social/main-feed.tsx` | 38-42 | `existingProjects` - Hardcoded projects for tag selector dropdown |
| `/src/components/social/main-feed.tsx` | 44-51 | `existingOrganizations` - Hardcoded orgs for tag selector dropdown |

### Low Priority (Development Utilities)

| File | Description |
|------|-------------|
| `/src/lib/supabase/mock.ts` | Full mock Supabase client - used for testing/development, can remain for now |

---

## UI Component Expectations

### PostCard (`/src/components/social/post-card.tsx`)

**Expects from Post type:**
- `likes: number` - Currently hardcoded to 0 in actions.ts
- `comments: number` - Currently hardcoded to 0 in actions.ts
- `linkedEventId: string | null`
- `linkedProjectId: string | null`
- `category: PostCategory`

**Implementation needed:**
- Fetch actual reaction counts from `post_reactions` table
- Fetch actual comment counts from `post_comments` table
- Add click handler to toggle like (add/remove reaction)
- Add click handler to open comments panel

### EventCard (`/src/components/social/event-card.tsx`)

**Expects:**
- Local state for `liked`/`likeCount`/`commentCount` (not connected to DB)
- `event.interestedOrgs` array
- `event.participantsReferred` count

**Implementation needed:**
- Connect like button to `post_reactions` or create `event_reactions` table
- Connect comment button to comments system

### Dashboard Actions (`/src/app/(authenticated)/dashboard/actions.ts`)

**Currently returns hardcoded values:**
```typescript
likes: 0,
comments: 0,
```

**Needs to query:**
```sql
-- For each post, count reactions
SELECT COUNT(*) FROM post_reactions WHERE post_id = ?

-- For each post, count comments
SELECT COUNT(*) FROM post_comments WHERE post_id = ? AND deleted_at IS NULL
```

---

## Potential Blockers

- [x] **CLEAR:** `post_reactions` table exists with correct structure
- [x] **CLEAR:** `post_comments` table exists with correct structure
- [x] **CLEAR:** `user_profiles` table exists (not `profiles`)
- [ ] **MISSING:** `notifications` table does not exist - if notifications feature is in scope, need DB migration first
- [ ] **MISSING:** `post_mentions` table referenced in `/src/lib/actions/posts.ts` may not exist in types
- [x] **CLEAR:** No `user_memberships` table needed - org/role is on `user_profiles` directly

---

## Potential Conflicts for Parallel Work

### Shared Files (HIGH RISK)

These files are likely to be edited by multiple agents:

| File | Likely Editors | Risk |
|------|----------------|------|
| `/src/app/(authenticated)/dashboard/actions.ts` | Feed data, reactions, comments | HIGH - Central data fetching |
| `/src/components/social/post-card.tsx` | Reactions agent, Comments agent | MEDIUM |
| `/src/components/social/event-card.tsx` | Reactions agent, Comments agent | MEDIUM |
| `/src/lib/types.ts` | Any agent adding new types | LOW |
| `/src/lib/social/types.ts` | Any agent modifying feed types | MEDIUM |

### Import Dependencies

```
dashboard/actions.ts
  -> imports types from @/lib/types
  -> imports supabase from @/lib/supabase/server
  -> used by dashboard/page.tsx

post-card.tsx
  -> imports Post type from @/lib/types
  -> used by main-feed.tsx

main-feed.tsx
  -> imports PostCard, EventCard, ProjectCard
  -> imports createPost from @/lib/actions/posts
```

### Recommended File Ownership

| Feature/Agent | Primary Files | Can Safely Edit |
|---------------|---------------|-----------------|
| Reactions | `/src/lib/actions/reactions.ts` (new) | post-card.tsx, event-card.tsx |
| Comments | `/src/lib/actions/comments.ts` (new), `/src/components/social/comments-panel.tsx` (new) | post-card.tsx |
| Feed Data | `/src/app/(authenticated)/dashboard/actions.ts` | types.ts |
| Notifications | `/src/lib/actions/notifications.ts` (new), DB migration | header.tsx |

---

## Recommended Changes Before Parallel Work

### 1. Create Missing Database Tables (if in scope)

```sql
-- Only if notifications feature is in Phase 2
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);
```

### 2. Verify `post_mentions` Table Exists

The code in `/src/lib/actions/posts.ts` references `post_mentions` table but it's not in the generated types. Either:
- Run type generation again
- Or create the table if missing

### 3. Establish File Locking Convention

For parallel agents, recommend:
1. Each agent creates NEW files for their feature (`/src/lib/actions/[feature].ts`)
2. Only ONE agent modifies shared files at a time
3. Use atomic commits per feature

### 4. Coordinate Type Changes

If multiple agents need to modify types:
- Agent 1 adds reaction types
- Agent 2 adds comment types
- Agent 3 adds notification types

Better to have ONE agent update types first, then others depend on it.

---

## Safe to Parallelize?

**YES** - with the following conditions:

1. **Assign clear file ownership** - See table above
2. **Sequence type changes** - Have one agent update shared types first
3. **Create new action files** - Each feature gets `/src/lib/actions/[feature].ts`
4. **Use database transactions** - Reactions and comments can run in parallel since they target different tables
5. **Check for notifications table** - If notifications is in scope, create the table first

### Suggested Agent Split:

| Agent | Scope | Dependencies |
|-------|-------|--------------|
| Agent 1 | Post Reactions (like button functionality) | None - can start immediately |
| Agent 2 | Post Comments (comment panel, add/delete comments) | None - can start immediately |
| Agent 3 | Feed Data Enhancement (remove mock data, add counts) | Wait for Agent 1 & 2 to define action files |
| Agent 4 | Notifications (if in scope) | Needs DB migration first |

---

## Quick Reference: Correct Table Names

| What CLAUDE.md Says | What Actually Exists |
|---------------------|---------------------|
| `profiles` | `user_profiles` |
| `organization_members` | Role is on `user_profiles.role` directly |
| `post_reactions` | `post_reactions` (correct) |
| `comments` | `post_comments` |
| `notifications` | **DOES NOT EXIST** |

---

## Files Inventory for Phase 2

### Existing Files to Modify
- `/src/app/(authenticated)/dashboard/actions.ts` - Remove mock data, add counts
- `/src/components/social/post-card.tsx` - Connect reactions/comments
- `/src/components/social/event-card.tsx` - Connect reactions/comments
- `/src/components/social/main-feed.tsx` - Replace hardcoded tag selector data

### New Files to Create
- `/src/lib/actions/reactions.ts` - Add/remove reactions
- `/src/lib/actions/comments.ts` - CRUD for comments
- `/src/components/social/comments-panel.tsx` - Comments UI component
- `/src/lib/actions/notifications.ts` - If notifications in scope

### Database Changes Needed
- None for reactions/comments (tables exist)
- Migration needed for notifications if in scope
