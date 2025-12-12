# St Martins Village Hub - Architecture Map

> **Created:** December 9, 2024
> **Last Updated:** December 9, 2024
> **Related Docs:** [MASTER_PLAN_DEC2024.md](./MASTER_PLAN_DEC2024.md), [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md), [AI_FEATURES_ROADMAP.md](./AI_FEATURES_ROADMAP.md)

---

## 1. Core Entity Relationships

```
                              ┌─────────────────┐
                              │   auth.users    │
                              │  (Supabase)     │
                              └────────┬────────┘
                                       │
                                       │ 1:1 (auto-created)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER DOMAIN                                      │
│  ┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐       │
│  │  user_profiles  │◄──►│  user_memberships   │    │  user_settings  │       │
│  │                 │    │                     │    │                 │       │
│  │  - full_name    │    │  - user_id          │    │  - user_id      │       │
│  │  - avatar_url   │    │  - org_id           │──┐ │  - theme        │       │
│  │  - bio          │    │  - role (enum)      │  │ │  - timezone     │       │
│  │  - job_title    │    │  - is_primary       │  │ │  - notif_prefs  │       │
│  │  - skills[]     │    └─────────────────────┘  │ └─────────────────┘       │
│  │  - interests[]  │                             │                           │
│  │  - social_links │                             │                           │
│  │  - phone        │                             │                           │
│  │  - account_status│ ← pending/approved/rejected│                           │
│  │  - gdpr_consent │                             │                           │
│  └─────────────────┘                             │                           │
└──────────────────────────────────────────────────┼───────────────────────────┘
                                                   │
                                                   │ N:1 (many members per org)
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ORGANIZATION DOMAIN                                 │
│  ┌───────────────────────────────────────────────────────────────────┐       │
│  │                         organizations                              │       │
│  │  - id, name, slug, description, logo_url, website, mission        │       │
│  │  - cause_areas[], primary_color, social_links, is_active          │       │
│  └───────────────────────────────────────────────────────────────────┘       │
│                                    │                                          │
│         All content is org-scoped (org_id FK on all content tables)          │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│      posts       │    │      events      │    │     projects     │
│                  │    │                  │    │                  │
│ - author_id      │    │ - organizer_id   │    │ - author_id      │
│ - org_id         │    │ - org_id         │    │ - org_id         │
│ - title          │    │ - title          │    │ - title          │
│ - content        │    │ - description    │    │ - description    │
│ - category       │◄──►│ - location       │◄──►│ - impact_goal    │
│ - image_url      │    │ - start/end_time │    │ - status         │
│ - linked_event_id│    │ - category       │    │ - progress       │
│ - linked_project │    │ - parent_project │    │ - partner_orgs[] │
│ - cause          │    │ - collab_orgs[]  │    │ - collaborators[]│
│ - is_pinned      │    │ - collab_users[] │    │ - interested[]   │
│ - website_status │    │ - website_status │    │ - website_status │
│ - poll_options[] │    │                  │    │                  │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  post_comments   │    │   event_rsvps    │    │ project_interest │
│  post_reactions  │    │                  │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 2. Key Relationships Table

| Entity | Connects To | How | Field |
|--------|-------------|-----|-------|
| **User** | Organizations | Many-to-many via join table | `user_memberships` |
| **Posts** | Events | Optional 1:1 link | `linked_event_id` |
| **Posts** | Projects | Optional 1:1 link | `linked_project_id` |
| **Posts** | Polls | One-to-many | `poll_options[]` → `poll_votes` |
| **Events** | Projects | Parent relationship | `parent_project_id` |
| **Events** | Other Orgs | Collaboration | `collaborating_orgs[]` |
| **Events** | Users | Individual collaborators | `collaborating_users[]` |
| **Projects** | Other Orgs | Partnership | `partner_orgs[]`, `interested_orgs[]` |
| **Meeting Notes** | Events | Link | `linked_event_id` |
| **Users** | Users | Connection requests | `connection_requests` table *(may not be needed - all users implicitly connected in building community)* |
| **All Content** | Website | Publish approval | `website_status` (pending/approved/rejected) |

---

## 3. Page → Data Source Mapping

| Page | Route | Primary Data | Secondary Data | Status |
|------|-------|--------------|----------------|--------|
| Dashboard | `/dashboard` | posts, events, projects | user_profiles, organizations | Partial (mock fallback) |
| People | `/people` | user_profiles, user_memberships | organizations, events, projects | ✅ Working |
| Calendar | `/calendar` | events | event_rsvps | ❌ MOCK DATA |
| Projects | `/projects` | projects | project_interest | Partial (mock mixed) |
| Project Detail | `/projects/[id]` | projects | events (linked), project_interest | ❌ BUG: getProjectById missing |
| Chat | `/chat` | conversations, messages | user_profiles | UI built, mock data |
| Opportunities | `/opportunities` | jobs, posts (category=opportunities) | - | ❌ NOT BUILT |
| Profile | `/profile` | user_profiles | user_settings | ❌ NOT BUILT |
| Settings | `/settings` | user_settings | - | ❌ NOT BUILT |
| Admin | `/admin` | all tables | user_feedback | ❌ NOT BUILT |
| Event Detail | `/events/[id]` | events, event_rsvps | - | ❌ NOT BUILT |
| Onboarding | `/onboarding` | user_profiles | organizations | ❌ NOT BUILT |

---

## 4. Database Views

| View | Source Tables | Purpose | Used By |
|------|---------------|---------|---------|
| `feed` | posts + events + projects + meeting_notes | Unified feed | Dashboard |
| `jobs_board` | jobs + posts (category='opportunities') | Combined opportunities | Opportunities page |

---

## 5. User Roles & Hierarchy

```
admin
  └── st_martins_staff
        └── partner_staff
              └── volunteer
```

### Role Capabilities

| Capability | Volunteer | Partner Staff | St Martins Staff | Admin |
|------------|-----------|---------------|------------------|-------|
| View content | ✅ | ✅ | ✅ | ✅ |
| Create posts | ✅ | ✅ | ✅ | ✅ |
| Create events | ❌ | ✅ | ✅ | ✅ |
| Edit own content | ✅ | ✅ | ✅ | ✅ |
| Edit any content | ❌ | ❌ | ✅ | ✅ |
| Delete any content | ❌ | ❌ | ✅ | ✅ |
| Send priority alerts | ❌ | ❌ | ✅ | ✅ |
| Pin content | ❌ | ❌ | ✅ | ✅ |
| Approve website publish | ❌ | ❌ | ❌ | ✅ |
| Approve new users | ❌ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Manage orgs | ❌ | ❌ | ❌ | ✅ |

---

## 6. Post System Details

### Post Categories

| Category | Icon | Purpose | Special Behavior |
|----------|------|---------|------------------|
| `general` | MessageSquare | Default | - |
| `intros` | Sparkles | Introductions | - |
| `wins` | Trophy | Celebrations | - |
| `opportunities` | Handshake | Jobs/volunteer | Also in jobs_board view |
| `questions` | HelpCircle | Asking help | - |
| `learnings` | Lightbulb | Insights | Shows cause badge |

### Post Features Implementation Status

| Feature | DB Schema | Backend | UI | Task | Notes |
|---------|-----------|---------|-----|------|-------|
| Text content | ✅ | ✅ | ✅ | - | Working |
| Categories | ✅ | ✅ | ✅ | - | 6 types |
| Link to Event | ✅ | ✅ | ✅ | - | `linked_event_id` |
| Link to Project | ✅ | ✅ | ✅ | - | `linked_project_id` |
| Images/Docs | ✅ | ❌ | Button only | 4.6 | Upload not implemented |
| Polls | ❌ | ❌ | Button only | 3.16 | Schema needed |
| @Mentions | Partial | ❌ | ✅ | 2.11 | UI works, not persisted |
| Reactions | ✅ | ❌ | ✅ | 2.9 | No DB calls |
| Comments | ✅ | ❌ | Minimal | 2.10 | Schema exists, no UI |
| Pin Posts | ✅ | ❌ | ❌ | 3.15 | Schema exists, no UI |
| Edit/Delete | ✅ | ❌ | ❌ | 2.10 | Users edit own |
| Website Publish | ❌ | ❌ | ❌ | 3.17 | Admin approval needed |

---

## 7. Data Flow: Database → UI

```
SUPABASE (PostgreSQL)          SERVER ACTIONS              REACT COMPONENTS
─────────────────────          ──────────────              ────────────────

┌─────────────────┐
│  organizations  │───┐
│  user_profiles  │───┼──► getPeopleData()     ──────►  PeoplePage
│ user_memberships│───┘    getOrganizationsData() ───►  PeopleLeftSidebar
└─────────────────┘

┌─────────────────┐            ┌──────────────┐
│     posts       │───┐        │              │
│     events      │───┼──────► │ getFeedData()│ ──────►  MainFeed
│    projects     │───┘        │              │          ├── PostCard
└─────────────────┘            └──────────────┘          ├── EventCard
                                                         └── ProjectCard

┌─────────────────┐
│     events      │──────────► (MOCK DATA)    ──────►  MonthlyCalendarView
│   event_rsvps   │
└─────────────────┘

┌─────────────────┐
│  conversations  │──────────► (MOCK DATA)    ──────►  ChatPage
│    messages     │
└─────────────────┘
```

---

## 8. Chat System (Currently Mock)

### Database Schema (Exists)

```
conversations
├── id, name, is_group, org_id, created_by, archived

conversation_participants
├── conversation_id, user_id, org_id, joined_at, last_read_at, muted

messages
├── id, conversation_id, sender_id, content
├── attachments (JSONB), reply_to_id, edited_at, deleted_at

message_reactions
├── message_id, user_id, emoji
```

### Current State
- Full schema exists in database
- UI components built with mock data
- **No real queries implemented**
- Mock data in `/src/components/chat/mock-data.ts`

---

## 9. Meeting Notes System

### Database Schema

```
meeting_notes
├── id, org_id, author_id, title, content
├── status (draft/published/archived)
├── meeting_date, linked_event_id, tags[]

meeting_attendees
├── note_id, user_id, org_id, role

action_items
├── id, note_id, assigned_to, title, description
├── due_date, status, completed_at

meeting_note_comments
├── id, note_id, author_id, content
```

### Current State
- Full schema exists
- **No UI implemented**
- Should attach to calendar events (recommendation)

---

## 10. Collaboration System

### Flow Diagram

```
Org A creates Project
        │
        ▼
┌───────────────────┐
│ Select orgs to    │
│ invite as collab  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐        ┌───────────────────┐
│inviteCollaborators│───────►│collaboration_     │
│      ()           │        │invitations table  │
└─────────┬─────────┘        └───────────────────┘
          │
          ▼
┌───────────────────┐        ┌───────────────────┐
│createNotification │───────►│ notifications     │
│       ()          │        │ table             │
└───────────────────┘        └───────────────────┘
          │
          │ Org B sees notification
          ▼
┌───────────────────┐
│respondToInvitation│
│ (accept/decline)  │
└─────────┬─────────┘
          │
          │ If accepted
          ▼
┌───────────────────┐
│ Org B added to    │
│collaborating_orgs[]│
└───────────────────┘
```

### What's Missing (Task 3.12)
- Post-acceptance permissions (what can collaborators do?)
- Remove collaborator function
- Collaboration role levels (owner, co-organizer, supporter)
- "My collaborations" view
- Individual user collaborators (not just orgs) for events

---

## 11. Orphaned Components

| Component | Location | Status | Task |
|-----------|----------|--------|------|
| `notifications-dropdown.tsx` | `/components/social/` | Built, not imported | 3.1 |
| `express-interest-button.tsx` | `/components/social/` | Built, not imported | 3.3 |
| `action-cta.tsx` | `/components/ui/` | Built, never imported | 3.2 |
| `sidebar.tsx` | `/components/layout/` | Old, never imported | 1.3 DELETE |
| `header.tsx` | `/components/layout/` | Old, never imported | 1.3 DELETE |

---

## 12. Issues Found

### Duplicate Components
| Component | Location 1 | Location 2 | Action |
|-----------|-----------|-----------|--------|
| `sphere-image-grid.tsx` | `/components/aitrium/` | `/components/social/aitrium/` | Consolidate |

### Similar Components
| Components | Issue | Action |
|------------|-------|--------|
| `monthly-calendar-option1/2/3.tsx` | 3 nearly identical | Pick one or make configurable |

### Schema Suggestions
| Issue | Location | Suggestion |
|-------|----------|------------|
| Array fields instead of junction tables | `partner_orgs[]`, `interested_orgs[]` | Consider proper M2M |
| Repeated query pattern | `feed.ts` | Abstract error handling |

---

## 13. Database Enums

| Enum | Values | Used By |
|------|--------|---------|
| `user_role` | admin, st_martins_staff, partner_staff, volunteer | user_memberships |
| `post_category` | intros, wins, opportunities, questions, learnings, general | posts |
| `event_category` | meeting, social, workshop, building_event, other | events |
| `project_status` | planning, active, on_hold, completed, cancelled | projects |
| `job_type` | paid_staff, volunteer, internship | jobs |
| `meeting_note_status` | draft, published, archived | meeting_notes |
| `reaction_type` | like | post_reactions |
| `account_status` | pending, approved, rejected | user_profiles |
| `website_status` | pending, approved, rejected | posts, events, projects |

---

## 14. New Schemas (To Build)

### Polls (Task 3.16)
```sql
poll_options
├── id, post_id, option_text, position

poll_votes
├── poll_option_id, user_id, voted_at
├── PRIMARY KEY (poll_option_id, user_id)  -- one vote per user
```

### User Feedback (Task 3.18)
```sql
user_feedback
├── id, user_id, description, page_url
├── screenshot_url, status (new/reviewed/resolved)
├── created_at
```

### Website Publishing (Task 3.17)
Fields added to posts, events, projects:
```sql
├── publish_to_website (boolean)
├── website_status (pending/approved/rejected)
├── website_approved_at, website_approved_by
├── website_rejected_reason
```

### User Profile Additions (Task 4.7)
Fields added to user_profiles:
```sql
├── phone, social_links (JSONB)
├── account_status (pending/approved/rejected)
├── approved_at, approved_by
├── gdpr_consent (boolean), gdpr_consent_at
```

---

## 15. Key Files Reference

### Database & Types
| File | Purpose |
|------|---------|
| `src/lib/database.types.ts` | Generated TypeScript types |
| `src/lib/social/types.ts` | Frontend types (FeedItem, etc.) |
| `supabase_migration_PUBLIC.sql` | Full database schema |

### Server Actions
| File | Purpose |
|------|---------|
| `src/lib/actions/events.ts` | Event CRUD |
| `src/lib/actions/projects.ts` | Project CRUD (missing getProjectById) |
| `src/lib/actions/collaboration.ts` | Invitations, notifications |
| `src/lib/queries/feed.ts` | Feed queries |

### Components
| File | Purpose |
|------|---------|
| `src/components/social/main-feed.tsx` | Feed + Create Post |
| `src/components/social/left-sidebar.tsx` | Nav + My Team + Highlights |
| `src/components/social/right-sidebar.tsx` | Alerts + Events carousel |
| `src/components/social/header.tsx` | Header with nav |

---

## 16. Ideas Backlog (Future Enhancements)

*Features to consider after MVP. Need design/implementation decisions before building.*

### Community Engagement Features

| Idea | Description | Implementation Questions |
|------|-------------|-------------------------|
| **Smart Reactions** | Reactions with meaning: "I can help" 🙋, "I have a connection" 🔗, "Bookmark" ⭐ | How do these trigger backend actions? Need reaction_type enum extension + action handlers |
| **Coffee Roulette** | Weekly random cross-org pairing for informal 1:1s | Opt-in system, matching algorithm, notification timing |
| **"New to Community" Badge** | Temporary badge for new members (invites welcomes) | Duration? Auto-remove after X days? Ties to onboarding completion |
| **Building Pulse** | "Who's in the building today" - see active/present users | Check-in system? Last-active timestamp? Privacy considerations |
| **Post-Event Photo Gallery** | Attendees share photos after events | Add to event detail page (Task 3.6), moderation needed? |

### Content & Insights Features

| Idea | Description | Implementation Questions |
|------|-------------|-------------------------|
| **Weekly Narrative Digest** | Auto-generated "This Week in Village Hub" story post | Cron job + AI or template? When to post? Who authors it? |
| **Impact Stories Template** | Structured post type for sharing outcomes with metrics | New post category or template? Fields: beneficiaries, outcome, metric |
| **Cross-Org Collaboration Metrics** | Track joint projects and outcomes | Dashboard view in admin? What metrics matter? |
| **Community Health Score** | Engagement trends over time | Admin-only? What signals indicate health? |

### Resource Sharing Features

| Idea | Description | Implementation Questions |
|------|-------------|-------------------------|
| **Skills Marketplace** | "I need X" / "I can offer Y" exchange board | Separate `/exchange` page? New `exchange_posts` table with type (need/offer) |
| **Shared Resources / Resource Lending** | Equipment/venue booking between orgs | New `shared_resources` table with booking system. Who owns what? Approval workflow? |

### Skills Marketplace Page Concept
```
/exchange or /marketplace
┌─────────────────────────────────────────────────────┐
│  🔄 Community Exchange                              │
├─────────────────────────────────────────────────────┤
│  [+ Post Need]  [+ Post Offer]    [Filter: All ▼]  │
├─────────────────────────────────────────────────────┤
│  NEEDS                                              │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🙋 Food Bank needs: Grant Writer              │ │
│  │    For December application deadline          │ │
│  │    Skills: grant-writing, fundraising         │ │
│  │    [I can help]                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  OFFERS                                             │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🎁 Youth Center offers: Free venue Tuesdays   │ │
│  │    After 5pm, capacity 30 people              │ │
│  │    [Request this]                             │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Shared Resources Schema Concept
```sql
shared_resources
├── id, org_id (owner), name, description
├── resource_type (equipment/venue/service)
├── availability_notes, image_url
├── is_active

resource_bookings
├── id, resource_id, requester_org_id
├── requested_date, status (pending/approved/rejected)
├── notes, approved_by
```

---

*End of Architecture Map*
