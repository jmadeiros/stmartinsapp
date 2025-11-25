# Multi-Organization Collaboration Feature

**Status:** Phase 1 Complete ✅ | Phase 2 In Progress 🚧

**Last Updated:** November 24, 2025

---

## Overview

This feature enables multiple charity organizations to collaborate on events and projects within The Village Hub platform. Organizations can invite each other to co-host events or work together on projects, with their names displayed together in the feed.

---

## User Stories

### Primary Stories

1. **As an event organizer**, I want to invite partner organizations to collaborate on my event, so we can pool resources and reach more people.

2. **As a project manager**, I want to show which organizations are partnering on a project, so the community can see the collaborative effort.

3. **As an organization admin**, I want to receive and respond to collaboration invitations, so I can decide which partnerships align with our mission.

4. **As a community member**, I want to see which organizations are collaborating, so I understand the partnerships in my community.

### Secondary Stories

5. **As an organization**, I want to express interest in collaborating on someone else's event/project, so I can proactively seek partnerships.

6. **As an event organizer**, I want to see which organizations are interested in my event, so I can evaluate potential partners.

---

## Implementation Phases

### Phase 1: Display Collaborations ✅ COMPLETE

**Goal:** Show multiple organization names on events and projects in the feed.

**What Was Built:**
- Database schema supports UUID arrays for `collaborating_orgs` (events) and `collaborators` (projects)
- Server actions fetch organization names from UUIDs
- UI displays multiple organization names:
  - 1 org: "St Martins Village"
  - 2 orgs: "St Martins Village **and** Youth Action Network"
  - 3+ orgs: "St Martins Village, Youth Action Network **· +2 more**"

**Files Modified:**
- [src/app/(authenticated)/dashboard/actions.ts](src/app/(authenticated)/dashboard/actions.ts) - Fetches org names, maps to Collaboration type
- [seed-database.ts](seed-database.ts) - Creates partner orgs, adds collaborator data
- [src/components/social/event-card.tsx](src/components/social/event-card.tsx) - Already had UI logic
- [src/components/social/project-card.tsx](src/components/social/project-card.tsx) - Already had UI logic

**Database Tables Used:**
- `events.collaborating_orgs` - UUID[] of collaborating organization IDs
- `projects.collaborators` - UUID[] of collaborating organization IDs
- `organizations` - Lookup table for org names and logos

**Testing:**
```bash
# Run seed script to populate test data
npx tsx seed-database.ts

# View dashboard at http://localhost:3001/dashboard
# Should see "St Martins Village and Youth Action Network" on Charity Fun Run event
```

---

### Phase 2: Invitation & Approval Flow 🚧 IN PROGRESS

**Goal:** Allow organizations to invite each other to collaborate, with accept/decline workflow.

#### 2.1 Database Schema ✅ COMPLETE

**New Tables Created:**

**`collaboration_invitations`** - Tracks invitation status
```sql
CREATE TABLE public.collaboration_invitations (
  id UUID PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('event', 'project')),
  resource_id UUID NOT NULL,
  inviter_org_id UUID NOT NULL,
  inviter_user_id UUID NOT NULL,
  invitee_org_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`notifications`** - General notification system
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  org_id UUID NOT NULL,
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
  resource_type TEXT,
  resource_id UUID,
  action_url TEXT,
  action_data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

**Automatic Triggers:**
- When an invitation is created → notification is sent to invitee org admin
- Notification finds admin using `user_profiles.organization_id` and `user_profiles.role = 'admin'`

**Files:**
- [add_collaboration_tables.sql](add_collaboration_tables.sql) - Migration to create tables
- [src/lib/collaboration.types.ts](src/lib/collaboration.types.ts) - TypeScript types

**To Run Migration:**
1. Open Supabase Dashboard → SQL Editor
2. Paste contents of `add_collaboration_tables.sql`
3. Run the migration
4. Verify tables exist: `SELECT * FROM collaboration_invitations;`

#### 2.2 Invite Collaborators UI ⏳ TODO

**Where:** Event/Project create/edit forms

**Design:**
- Add "Invite Collaborators" multiselect dropdown
- Lists all organizations in the network
- Selected orgs receive pending invitations
- Shows "(Pending)" badge for invited orgs

**Files to Create/Modify:**
- Create: `src/components/forms/invite-collaborators-field.tsx`
- Modify: Event create form (TBD location)
- Modify: Project create form (TBD location)

#### 2.3 Server Actions ⏳ TODO

**Actions Needed:**

**`inviteCollaborator(resourceType, resourceId, inviteeOrgId, message?)`**
- Creates record in `collaboration_invitations`
- Trigger automatically creates notification
- Returns `{ success: boolean, error?: string }`

**`respondToInvitation(invitationId, accept: boolean)`**
- Updates invitation status to 'accepted' or 'declined'
- If accepted: adds org to `collaborating_orgs` or `collaborators` array
- Creates notification back to inviter
- Returns `{ success: boolean, error?: string }`

**`expressInterest(resourceType, resourceId)`**
- Creates invitation with inviter/invitee reversed
- Sends notification to resource organizer
- Returns `{ success: boolean, error?: string }`

**Files to Create:**
- `src/app/(authenticated)/dashboard/collaboration-actions.ts`

#### 2.4 Express Interest Button ⏳ TODO

**Where:** Event and Project cards

**Design:**
- Button appears when `seeking_partners: true`
- Label: "Express Interest" or "Partner with us"
- On click: Shows confirmation, sends request
- Shows feedback: "Interest sent!"

**Files to Modify:**
- [src/components/social/event-card.tsx](src/components/social/event-card.tsx)
- [src/components/social/project-card.tsx](src/components/social/project-card.tsx)

#### 2.5 Notification Display ⏳ TODO

**Where:** Header bell icon

**Design:**
- Badge shows unread count
- Dropdown shows recent notifications
- Types of notifications:
  - "Youth Action Network invited you to collaborate on 'Charity Fun Run 5K'"
  - "St Martins Village accepted your collaboration request"
  - "Community Arts Trust wants to collaborate on your project"

**Actions:**
- Accept button → calls `respondToInvitation(id, true)`
- Decline button → calls `respondToInvitation(id, false)`
- View button → navigates to resource
- Mark as read → updates `notifications.read = true`

**Files to Create/Modify:**
- Create: `src/components/notifications/notification-dropdown.tsx`
- Create: `src/components/notifications/notification-item.tsx`
- Modify: [src/components/social/header.tsx](src/components/social/header.tsx) - Wire up bell icon

#### 2.6 Accept/Decline Actions ⏳ TODO

**Flow:**
1. User clicks Accept/Decline in notification
2. Calls `respondToInvitation(invitationId, accept)`
3. Server updates invitation status
4. If accepted: Adds org to event/project collaborators array
5. Creates notification back to inviter
6. Updates UI to show new collaborator

**Files to Create:**
- Create: `src/components/notifications/invitation-actions.tsx`

---

## Phase 3: Future Enhancements ⏳ PLANNED

### 3.1 Delegation
- Admin can forward invitation to specific team member
- "Assign to [team member]" dropdown

### 3.2 Collaboration Permissions
- Define what collaborators can do:
  - Edit event/project details?
  - Invite more collaborators?
  - Post updates?

### 3.3 Collaboration History
- View past collaborations between orgs
- "You've collaborated 3 times before"
- Success metrics from previous partnerships

### 3.4 Collaboration Templates
- Quick invite for recurring partnerships
- "Invite usual partners" button
- Pre-fill invitation message

---

## Database Schema Notes

### Simplified Schema Change

**Previous (Complex):**
```
user_memberships table → tracks many-to-many user-org relationships
```

**Current (Simplified):**
```sql
user_profiles:
  - organization_id UUID  -- Single org per user
  - role TEXT            -- 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'
```

**Why:** Simplified for MVP. Each user belongs to one primary organization. This was documented in [cleanup_user_memberships.sql](cleanup_user_memberships.sql).

**Impact on Collaboration:**
- Notifications go to admin user via `user_profiles.role = 'admin'`
- Function: `get_org_representative_user_id(org_id)` finds admin

---

## API Reference

### Server Actions (To Be Implemented)

```typescript
// Invite an organization to collaborate
async function inviteCollaborator(params: {
  resourceType: 'event' | 'project'
  resourceId: string
  inviteeOrgId: string
  message?: string
}): Promise<{ success: boolean; error?: string }>

// Respond to an invitation
async function respondToInvitation(params: {
  invitationId: string
  accept: boolean
}): Promise<{ success: boolean; error?: string }>

// Express interest in collaborating
async function expressInterest(params: {
  resourceType: 'event' | 'project'
  resourceId: string
}): Promise<{ success: boolean; error?: string }>

// Get notifications for current user
async function getNotifications(params: {
  userId: string
  unreadOnly?: boolean
  limit?: number
}): Promise<{ data: Notification[]; error?: string }>

// Mark notification as read
async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }>
```

---

## Testing Checklist

### Phase 1 Testing ✅
- [x] Seed script creates partner organizations
- [x] Events display multiple org names
- [x] Projects display multiple org names
- [x] Dashboard shows "Org A and Org B" format
- [x] Dashboard shows "Org A, Org B · +2 more" for 3+ orgs

### Phase 2 Testing ⏳
- [ ] Migration creates tables successfully
- [ ] Invitation creates notification automatically
- [ ] Notification appears in header bell
- [ ] Accept invitation adds org to collaborators
- [ ] Decline invitation updates status
- [ ] Express Interest sends notification to organizer
- [ ] Multiple invitations to same resource handled correctly
- [ ] Invitation to already-collaborating org prevented

---

## UI/UX Design Decisions

### Collaboration Display Pattern
Inspired by Instagram's collaboration posts:
- Clear visual indicator of partnership
- All org names clickable (future: link to org profile)
- Graceful overflow for many collaborators

### Invitation Flow (Decided: Option 1)
**Chosen:** Notify organization admin only

**Alternatives Considered:**
- Option 2: Notify all staff members
- Option 3: Notify based on role/context
- Option 4: Notify admin + allow delegation

**Why Option 1:** Simplest for MVP, clear ownership, avoid notification spam

### Express Interest vs Interested Orgs
**`interested_orgs` array** - Passive tracking, no action required
**"Express Interest" button** - Active request, requires approval

**Decision:** Keep both for different use cases

---

## Migration History

1. **Nov 20, 2025** - Migrated from `app` schema to `public` schema
2. **Nov 23, 2025** - Ran `cleanup_user_memberships.sql` - Removed user_memberships table
3. **Nov 24, 2025** - Implemented Phase 1 collaboration display
4. **Nov 24, 2025** - Created Phase 2 database schema (add_collaboration_tables.sql)

---

## Known Issues & Limitations

### Current Limitations
- No way to remove a collaborator once added (Phase 3 feature)
- No collaboration permissions system yet
- Single admin per org receives all notifications
- No collaboration history or analytics

### Technical Debt
- TODO comments in actions.ts for fetching org avatars
- Hardcoded "St Martins Village" organization name in author objects
- No real-time updates when invitations accepted/declined
- No email notifications for invitations

---

## Related Documentation

- [CLAUDE.md](CLAUDE.md) - Project architecture patterns
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Full schema documentation (if exists)
- [cleanup_user_memberships.sql](cleanup_user_memberships.sql) - Schema simplification
- [src/lib/collaboration.types.ts](src/lib/collaboration.types.ts) - TypeScript types

---

## Questions & Decisions Log

**Q: Should we notify org admin or all staff?**
**A:** Notify admin only for MVP (Nov 24, 2025)

**Q: Should "Express Interest" immediately add to interested_orgs or require approval?**
**A:** Require approval, notify organizer (Nov 24, 2025)

**Q: Use user_memberships or simplified schema?**
**A:** Use simplified schema with organization_id in user_profiles (Nov 23, 2025)

---

## Success Metrics (Future)

- Number of collaborations created per month
- Percentage of events/projects with multiple orgs
- Invitation acceptance rate
- Time from invitation to acceptance
- Repeat collaborations between same orgs
