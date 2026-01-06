# Phase 3 Decisions - Pre-Implementation

> **Created:** December 15, 2024
> **Last Updated:** December 29, 2024
> **Status:** In Progress
> **Purpose:** Capture all user decisions before starting Phase 3 tasks

---

## Implementation Status

| Task | Description | Status | Notes |
|------|-------------|--------|-------|
| 3.1 | Notifications Dropdown | ✅ Done | Integrated in header |
| 3.2 | ActionCTA in RSVP Flow | ✅ Done | RSVP persists to DB, support options (volunteer/partner) saved, notifications sent |
| 3.3 | Interest Button | ✅ Done | Interest persists to DB, support options saved, notifications sent (Jan 4) |
| 3.4 | Event Comments | ✅ Done | DB tables + server actions + UI (Dec 29) |
| 3.5 | Project Comments | ✅ Done | DB tables + server actions + UI (Dec 29) |
| 3.6 | Event Detail Page | ✅ Done | `/events/[id]` route |
| 3.7 | Opportunities Page | ⏸️ On Hold | User deciding structure |
| 3.8 | Search | ✅ Done | Global search implemented |
| 3.9 | Profile Page | ✅ Done | `/profile` route |
| 3.10 | Settings Page | ✅ Done | `/settings` route |
| 3.11 | Admin Page | ✅ Done | `/admin` route |
| 3.12 | Collaboration Roles | ❌ Not Done | No UI for role management |
| 3.13 | Meeting Notes | ❌ Not Done | DB exists, needs UI on `/meeting-notes` |
| 3.14 | Acknowledge Button | ✅ Done | Priority alerts acknowledgment |
| 3.15 | Post Pinning | ✅ Done | Admin-only pin/unpin |
| 3.16 | Polls | ✅ Done | WhatsApp-style polls |
| 3.17 | Publish to Website | ⏸️ On Hold | Queue UI exists, publishing logic parked |
| 3.18 | User Feedback | ✅ Done | Report issue button |
| - | Org Profile Page | ✅ Done | `/organizations/[id]` |
| - | Event/Project Reactions | ✅ Done | Persistent likes (Dec 29) |

**Summary:** 15/18 tasks complete, 3 on hold (3.7, 3.17), 2 remaining (3.12, 3.13)

---

## Technical Terms Reference

| Term | Meaning |
|------|---------|
| **Race Condition** | Two requests firing simultaneously causing duplicate/error. Mitigated with unique constraints + disabled buttons during request |
| **Threading** | Nested comment replies using `parent_comment_id` |
| **Unified Schema** | One `comments` table with `reference_type` (post/event/project) instead of separate tables |

---

## Task Decisions

### 3.1 Integrate NotificationsDropdown
| Decision | Answer |
|----------|--------|
| Polling frequency | Real-time subscription (frequent is fine) |
| Group notifications? | **YES** - Already implemented |
| Mark-as-read behavior | **On click** - Already implemented |

### 3.2 Use ActionCTA in RSVP Flow
| Decision | Answer |
|----------|--------|
| Can users change RSVP status? | **YES** |
| Notify event creator on RSVP? | **YES** |
| Future enhancement | Add to Google Calendar / Apple Calendar option |
| Styling | Improve ActionCTA UI if needed during integration |

### 3.3 Use ExpressInterestButton
| Decision | Answer |
|----------|--------|
| Different from collaborate? | **YES** - Express interest is separate |
| Collaborate meaning | Grants edit access to project/event |

### 3.4 Event Comments System
| Decision | Answer |
|----------|--------|
| Who can comment? | **Anyone** (not just RSVP'd) |
| Notify event organizer? | **YES** |
| Character limit? | **YES** - Add reasonable limit |
| Spam concern? | **NO** - Don't worry about spam |
| Threading support? | **YES** - Use `parent_comment_id` for nested replies |

### 3.5 Project Comments System
| Decision | Answer |
|----------|--------|
| Schema | **Same as event comments** - Unified approach |
| Visibility | **Public** - Visible to anyone (transparent) |

### 3.6 Event Detail Page
| Decision | Answer |
|----------|--------|
| Attendee list visibility | **PUBLIC** - Show on calendar |
| Co-organizers edit? | **YES** - Co-organizers CAN edit |
| On event deletion | Send "event cancelled" notification |
| 404 handling | Friendly "event not found" message |

### 3.7 Build Opportunities Page
| Decision | Answer |
|----------|--------|
| Status | **ON HOLD** - User deciding structure |

### 3.8 Build Search
| Decision | Answer |
|----------|--------|
| Searchable entities | **ALL** - Posts, events, projects, people, volunteers, opportunities |
| Fuzzy matching? | **YES** |
| Permission restrictions | **Minimal** - Not much is private |
| Filters? | **NO** - Keep simple |

### 3.9 Build Profile Page
| Decision | Answer |
|----------|--------|
| Design pattern | Follow LinkedIn/Facebook |
| Required vs optional fields | Provide recommendations for approval |
| Can users see others' profiles? | **YES** |
| Social links | **YES** - LinkedIn, Twitter, Instagram |

**Recommended Fields:**
| Field | Required? | Notes |
|-------|-----------|-------|
| Full Name | Required | Already exists |
| Email | Required | Already exists |
| Job Title | Required | Professional context |
| Organization | Required | Already exists |
| Profile Photo | Optional | Nice to have |
| Phone | Optional | Privacy consideration |
| Bio | Optional | Self-description |
| Skills | Optional | Array of skills |
| Interests | Optional | Array of interests |
| LinkedIn URL | Optional | Social link |
| Twitter URL | Optional | Social link |
| Instagram URL | Optional | Social link |

### 3.10 Build Settings Page
| Decision | Answer |
|----------|--------|
| Notification channels | **In-app** now, **email** later |
| Can opt out? | **YES** - Except for alerts |
| Dark mode? | **NO** - Not needed |

### 3.11 Build Admin Page
| Decision | Answer |
|----------|--------|
| Admin model | **Single admin team** (user + few others) |
| Org admins? | **NO** - Just org managers |
| Soft delete? | **YES** - With recovery period |
| Audit logging? | Recommended for accountability |

### 3.12 Collaboration Management (Simplified)
| Decision | Answer |
|----------|--------|
| Owner vs Collaborator | **Owner** = creating org (full control). **Collaborators** = joined orgs |
| Co-owners concept | **NO** - Removed. Only owner + collaborators |
| Collaborator permissions | **CAN edit** events/projects they collaborate on |
| Remove notification | **Silent removal** - no notification sent |
| My Collaborations | Section on profile page showing projects/events user's org collaborates on |
| Management UI location | On project/event detail page |

**Implementation Plan:**
- 3 parallel agents: (1) Backend actions, (2) Management UI, (3) Profile integration
- Add `removeCollaborator()`, `getMyCollaborations()` server actions
- Build `CollaboratorManagement` component for detail pages
- Add "My Collaborations" to profile page

### 3.13 Meeting Notes (Import-Based)
| Decision | Answer |
|----------|--------|
| Source | **Granola AI** meeting transcription summaries |
| Input method | **API endpoint** - Granola → Zapier → Village Hub API |
| Manual creation | **NO** - Users cannot manually create notes |
| Content format | Markdown (to be confirmed) |
| Action item matching | Skip assignee matching for now, just get it set up |
| My Action Items | **Separate page** at `/my-action-items` |
| Visibility | All org members can see all published notes |

**Granola Integration Notes:**
- Granola has no public API, integrates via **Zapier**
- Flow: Granola → Zapier webhook → `/api/meeting-notes/import` → DB
- API accepts JSON with meeting_date, title, summary, action_items array
- Authentication via API key in header

**Implementation Plan:**
- 3 parallel agents: (1) Data layer/types, (2) Import API, (3) Read-only UI
- Build `/api/meeting-notes/import` endpoint for Zapier
- Build `/meeting-notes` list page (read-only)
- Build `/meeting-notes/[id]` detail page
- Build `/my-action-items` page
- Add "Meeting Notes" to navigation

### 3.14 Acknowledge Button
| Decision | Answer |
|----------|--------|
| Dismiss scope | **Per-user only** (not all users) |

### 3.15 Post Pinning
| Decision | Answer |
|----------|--------|
| Max pinned posts | **3** |
| Expiry? | **YES** - User chooses duration |
| Duration options | 1 day, 3 days, 1 week, 2 weeks |

### 3.16 Build Polls
| Decision | Answer |
|----------|--------|
| Can change vote? | **NO** |
| Anonymous? | **NO** |
| Choice type | **Creator chooses** - Single or multi |
| Style reference | WhatsApp polls |

### 3.17 Publish to Website
| Decision | Answer |
|----------|--------|
| Tech stack | Next.js (user owns full stack) |
| Projects destination | News section on website |
| Events destination | Calendar on website |
| Content updates | Can update before publish; once on website, won't sync |
| Approval SLA | **NO** - Not needed |
| On internal delete | Send notification to admin (don't auto-unpublish) |

### 3.18 User Feedback System
| Decision | Answer |
|----------|--------|
| Feedback destination | Send to user's email |
| Screenshot upload | Optional |
| Feedback history | Nice-to-have (not critical) |

---

## Summary by Complexity

| Complexity | Tasks | Count |
|------------|-------|-------|
| 🟢 Small | 3.1, 3.3, 3.5, 3.14, 3.15, 3.18 | 6 |
| 🟡 Medium | 3.2, 3.4, 3.6, 3.7*, 3.9, 3.10, 3.13, 3.16 | 8 |
| 🔴 Large | 3.8, 3.11, 3.12, 3.17 | 4 |

*3.7 on hold pending user decision

---

## Dependencies Identified

```
3.1 NotificationsDropdown → Independent (can start immediately)
3.2 ActionCTA → Depends on event-card, project-card
3.3 ExpressInterestButton → Depends on project-card
3.4 Event Comments → Depends on 3.6 (Event Detail Page)
3.5 Project Comments → Depends on 3.4 (shares infrastructure)
3.6 Event Detail Page → Independent (can start immediately)
3.7 Opportunities → ON HOLD
3.8 Search → Independent (can start immediately)
3.9 Profile Page → Independent (can start immediately)
3.10 Settings Page → Independent (can start immediately)
3.11 Admin Page → Independent (can start immediately)
3.12 Collaboration → Depends on existing collaboration backend
3.13 Meeting Notes → Depends on 3.6 (Event Detail Page)
3.14 Acknowledge → Depends on 2.4 (Priority Alerts - DONE)
3.15 Post Pinning → Independent (can start immediately)
3.16 Build Polls → Independent (requires schema migration)
3.17 Website Publish → Depends on 3.11 (Admin approval queue)
3.18 User Feedback → Independent (can start immediately)
```

---

## High-Risk Tasks (Require Extra Care)

| Task | Risk | Mitigation |
|------|------|------------|
| **3.11 Admin** | Authorization bypass | Double-check on every action; RLS policies |
| **3.12 Collaboration** | Permission complexity | Clear role definitions; extensive testing |
| **3.17 Website Publish** | PII on public site | Admin preview; strip personal info |
| **3.8 Search** | Privacy leak | Must respect visibility; test with multiple users |

---

*End of Phase 3 Decisions*
