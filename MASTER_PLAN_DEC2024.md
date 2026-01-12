# St Martins Village Hub - Master Implementation Plan

> ⚠️ **AUTHORITATIVE PLANNING DOCUMENT**
> This is the single source of truth for implementation planning.
> Supersedes: `MASTER_PLAN.md`, `REVISED_PLAN.md`, `IMPLEMENTATION_PLAN.md`
> Last verified: December 15, 2024

> **Created:** December 9, 2024
> **Last Updated:** January 11, 2026
> **Status:** Phase 4 COMPLETE ✅ | Phase 5 COMPLETE ✅ | Ready for Production
> **Related Docs:** [ARCHITECTURE_MAP.md](./ARCHITECTURE_MAP.md), [AI_FEATURES_ROADMAP.md](./AI_FEATURES_ROADMAP.md)

---

## Pre-Phase: What's Already Working ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Dev Login | ✅ Works | Creates user + profile + org membership |
| User → Org Connection | ✅ Works | `user_memberships` table |
| Create Event | ✅ Works | Dialog → `createEvent()` → DB |
| Create Project | ✅ Works | Dialog → `createProject()` → DB |
| Create Post | ✅ Works | Wired in Phase 1.8 |
| OAuth UI | ✅ Works | Google + Microsoft configured |
| OAuth callback | ✅ Works | Route at `/auth/callback` detects new users |
| Post-OAuth user setup | ✅ Works | Redirects to `/onboarding` wizard |
| File Uploads | ✅ Works | 3 storage buckets configured |
| Real-time Feed | ✅ Works | Multi-table subscriptions |
| User Approval | ✅ Works | Admin panel at `/admin/approvals` |

### Production User Onboarding ✅ IMPLEMENTED

For real users (not dev login), the full sign-up flow:

**1. OAuth Sign-In**
- User clicks "Continue with Google" or "Continue with Microsoft"
- Supabase creates `auth.users` row
- Auth callback detects incomplete profile → redirects to `/onboarding`

**2. Onboarding Wizard (`/onboarding`) - 4 Steps**

**Step 1: Profile**
- Full Name (required)
- Job Title (optional)
- Bio (optional)
- Avatar with initials preview

**Step 2: Organization**
- Select from list of organizations
- Creates `user_membership` entry with role='member'

**Step 3: Skills & Interests**
- Multi-select badges for 16 skills
- Multi-select badges for 16 interest areas
- Social links (LinkedIn, Twitter, Website)

**Step 4: Notifications**
- Email notifications toggle
- Push notifications toggle
- Digest frequency (daily/weekly/never)

**3. Pending Approval**
- User sees `/pending-approval` screen
- Admin reviews in `/admin/approvals`
- Admin approves with role selection → user redirected to dashboard
- Admin rejects with reason → user sees rejection message

**Database Changes Implemented:**
| Field | Table | Purpose |
|-------|-------|---------|
| `approval_status` | `user_profiles` | 'pending', 'approved', 'rejected' |
| `approved_at` | `user_profiles` | When admin approved |
| `approved_by` | `user_profiles` | Admin who approved |
| `rejection_reason` | `user_profiles` | Text explaining rejection |

**Future Enhancements (Phase 6):**
- Avatar upload during onboarding
- GDPR consent checkbox
- Email notifications on approval/rejection

---

## Infrastructure Notes

### Email Setup (part of 4.7)
**Provider:** Resend (free tier: 3k emails/month) or Supabase built-in

**Templates needed:**
| Email | When Sent |
|-------|-----------|
| Welcome/Approved | Admin approves user sign-up |
| Rejected | Admin rejects user sign-up (include reason) |
| Website Approved | Admin approves content for website |

### Error Tracking & User Feedback
**Sentry** (add when test users start):
- Automatic error catching
- Free tier sufficient for this scale
- Users can comment on errors they trigger

**Feedback Button** (build simple in-app):
- "Report Issue" button in header or settings
- Form: description + screenshot option + current page URL
- Saves to `user_feedback` table or sends to Slack

### Testing Approach
- **Manual testing** after each task completion
- **Test with real data** before removing mock fallbacks
- **Test user group** before Phase 4 completion
- No automated test suite needed initially (can add later for SaaS)

### Responsive Testing (Ongoing)
Test at these widths after building/modifying UI components:

| Size | Width | Check For |
|------|-------|-----------|
| Mobile | 375px | No horizontal scroll, readable text, tappable buttons |
| Tablet | 768px | Layout uses space well, sidebars visible if needed |
| Laptop | 1024px | 3-column layout works, nothing overlaps |
| Desktop | 1440px | Content centered, not stretched too wide |

**How:** Chrome DevTools → Device toolbar (`Cmd+Shift+M`) → drag edges or pick presets

**Common issues to watch:**
- Fixed widths (`w-80`, `w-64`) → use `w-full sm:w-80` pattern
- Dropdowns/popovers overflowing screen edges
- Padding too large on mobile (`p-8` → `p-4 sm:p-6 md:p-8`)
- Sidebars hidden when they shouldn't be

### Row Level Security (RLS) Notes

**⚠️ IMPORTANT: RLS should NOT block development.**

**Development Approach:**
1. Build feature first, test it works
2. Add RLS policy AFTER feature is working
3. Test again to ensure RLS doesn't break it
4. If RLS causes issues → temporarily disable while debugging

**How to disable RLS if stuck:**
```sql
-- In Supabase SQL editor (for debugging only!)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Re-enable when done:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

**Policies to add (one at a time, after feature works):**

| Feature | RLS Rule | When to Add |
|---------|----------|-------------|
| Post reactions | Users can only delete own | After 2.9 works |
| Posts | Users can only edit/delete own posts | After 2.10 works |
| Post comments | Users can only edit/delete own | After 2.10 works |
| Events | Organizers can edit/delete own events | After 3.6 works |
| Event comments | Users can only edit/delete own | After 3.4 works |
| Projects | Owners can edit/delete own projects | After 3.12 works |
| User profiles | Users can only edit own | After 3.9 works |
| Feedback | Users can only see own submissions | After 3.18 works |

Most RLS already exists for core tables. The above are additions for new features.

---

## PHASE 1: Critical Fixes & Cleanup 🔧 ✅ COMPLETE
*Stabilize before building*

| # | Task | Files | Complexity | Status |
|---|------|-------|------------|--------|
| 1.1 | **Fix `getProjectById`** | `lib/actions/projects.ts` | 🟢 Small | ✅ Done |
| 1.2 | **Delete empty `/directory` route** | `app/(authenticated)/directory/` | 🟢 Small | ✅ Done |
| 1.3 | **Delete old `/components/layout/`** | `components/layout/` | 🟢 Small | ✅ Done |
| 1.4 | **Fix hardcoded `isManager: true`** | `main-feed.tsx` | 🟢 Small | ✅ Done |
| 1.5 | **Fix "Current User" hardcoded** | `main-feed.tsx` | 🟢 Small | ✅ Done |
| 1.6 | **Regenerate TypeScript types** | `database.types.ts` | 🟢 Small | ✅ Done |
| 1.7 | **Add event category picker** | `create-event-dialog.tsx` | 🟢 Small | ✅ Done |
| 1.8 | **Wire up Create Post** | `main-feed.tsx` | 🟢 Small | ✅ Done |

---

## PHASE 2: Core Feature Completion 🔌 ✅ COMPLETE
*Wire mock data to real Supabase*

| # | Task | Files | Complexity | Status |
|---|------|-------|------------|--------|
| 2.1 | **Wire up Chat** | `components/chat/*` | 🔴 Large | ✅ Done |
| 2.2 | **Wire up Calendar** | `calendar/page.tsx` | 🟡 Medium | ✅ Done |
| 2.3 | **Wire up My Team Box** | `left-sidebar.tsx` | 🟡 Medium | ✅ Done |
| 2.4 | **Wire up Priority Alerts** | `right-sidebar.tsx` | 🟡 Medium | ✅ Done |
| 2.5 | **Wire up Badge Counts** | `header.tsx` | 🟡 Medium | ✅ Done |
| 2.6 | **Remove mock fallback from Dashboard** | `dashboard/actions.ts` | 🟢 Small | ✅ Done |
| 2.7 | **Wire up Community Highlights** | `left-sidebar.tsx` | 🟡 Medium | ✅ Done |
| 2.8 | **Remove mock projects** | `projects/page.tsx` | 🟢 Small | ✅ Done |
| 2.9 | **Wire up Post Reactions** | `post-card.tsx` | 🟢 Small | ✅ Done |
| 2.10 | **Wire up Post Comments** | `post-card.tsx` | 🟡 Medium | ✅ Done |
| 2.11 | **Persist @Mentions** | `main-feed.tsx` | 🟢 Small | ✅ Done |

---

## PHASE 3: New Features ✨ ✅ COMPLETE (15/18)
*Build missing functionality*

| # | Task | Files | Complexity | Status |
|---|------|-------|------------|--------|
| 3.1 | **Integrate NotificationsDropdown** | `header.tsx` | 🟢 Small | ✅ Done |
| 3.2 | **Use ActionCTA in RSVP flow** | `event-card.tsx` | 🟡 Medium | ❌ Removed (not needed) |
| 3.3 | **Use ExpressInterestButton** | cards | 🟢 Small | ❌ Removed (not needed) |
| 3.4 | **Event Comments System** | `event-card.tsx` | 🟡 Medium | ✅ Done (Dec 29) |
| 3.5 | **Project Comments System** | `project-card.tsx` | 🟢 Small | ✅ Done (Dec 29) |
| 3.6 | **Event Detail Page** | `/events/[id]` | 🟡 Medium | ✅ Done |
| 3.7 | **Build Opportunities Page** | `/opportunities` | 🟡 Medium | ➡️ Moved to Phase 5 |
| 3.8 | **Build Search** | `header.tsx` | 🔴 Large | ✅ Done |
| 3.9 | **Build Profile Page** | `/profile` | 🟡 Medium | ✅ Done |
| 3.10 | **Build Settings Page** | `/settings` | 🟡 Medium | ✅ Done |
| 3.11 | **Build Admin Page** | `/admin` | 🔴 Large | ✅ Done |
| 3.12 | **Collaboration Roles UI** | detail sidebars | 🔴 Large | ✅ Done (Jan 6) - pending user testing |
| 3.13 | **Meeting Notes UI** | `/meeting-notes` | 🟡 Medium | ✅ Done (Jan 6) - pending user testing, includes Granola API sync |
| 3.14 | **Acknowledge Button** | `right-sidebar.tsx` | 🟢 Small | ✅ Done |
| 3.15 | **Post Pinning** | `post-card.tsx` | 🟢 Small | ✅ Done |
| 3.16 | **Build Polls** | `main-feed.tsx` | 🟡 Medium | ✅ Done |
| 3.17 | **Publish to Website** | admin queue, API | 🔴 Large | ➡️ Moved to Phase 5 |
| 3.18 | **User Feedback System** | Header | 🟢 Small | ✅ Done |
| - | **Org Profile Page** | `/organizations/[id]` | 🟡 Medium | ✅ Done |
| - | **Event/Project Reactions** | cards | 🟢 Small | ✅ Done (Dec 29) |

---

## PHASE 4: Polish & Production 🚀 ✅ COMPLETE
*Production readiness*

| # | Task | Files | Complexity | Status |
|---|------|-------|------------|--------|
| 4.1 | **Re-enable auth check** | `layout.tsx` | 🟢 Small | ✅ Done |
| 4.2 | **Remove all console.log** | Multiple files | 🟡 Medium | ✅ Done (contextual logging kept) |
| 4.3 | **Remove TODO comments** | Various | 🟢 Small | ✅ Done |
| 4.4 | **Clean up old routes** | Route files | 🟢 Small | ✅ Done |
| 4.5 | **Real-time subscriptions** | Chat, feed, notifications | 🟡 Medium | ✅ Done (use-feed-realtime.ts) |
| 4.6 | **File uploads** | Post creation, profiles | 🟡 Medium | ✅ Done (3 buckets: avatars, post-images, event-images) |
| 4.7 | **OAuth + User Onboarding** | Supabase config | 🟡 Medium | ✅ Done (Google + Microsoft OAuth) |
| 4.8 | **Mobile responsiveness audit** | All components | 🟡 Medium | ✅ Done |
| 4.9 | **Error handling & loading states** | All pages | 🟡 Medium | ✅ Done (8+ error.tsx/loading.tsx files) |
| 4.10 | **Linked event/project navigation** | `post-card.tsx` | 🟢 Small | ✅ Done |
| 4.11 | **Post editing** | `post-card.tsx`, actions | 🟡 Medium | ✅ Done (inline edit + updatePost action) |
| 4.12 | **Toast notifications for errors** | RSVP, interest flows | 🟢 Small | ✅ Done |
| 4.13 | **Regenerate database types** | `database.types.ts` | 🟢 Small | ✅ Done |
| 4.14 | **Fix `as any` type casts** | Multiple files | 🟡 Medium | ✅ Done (reduced to necessary casts) |
| 4.15 | **Update CLAUDE.md docs** | `CLAUDE.md` | 🟢 Small | ✅ Done |
| 4.16 | **Remove hardcoded mock data** | Various components | 🟢 Small | ✅ Done |

### Phase 4 Implementation Details

**4.5 Real-time Subscriptions:**
- Hook: `/src/hooks/use-feed-realtime.ts`
- Migration: `20260106200000_enable_feed_realtime.sql`
- Subscribes to: posts, comments, reactions, RSVPs, project interests
- React Query cache integration for instant updates

**4.6 File Uploads:**
- Storage actions: `/src/lib/actions/storage.ts`
- UI component: `/src/components/ui/image-upload.tsx`
- Migration: `20260106200001_create_storage_buckets.sql`
- Functions: `uploadAvatar()`, `uploadPostImage()`, `uploadEventImage()`
- Max 50MB, JPEG/PNG/GIF/WebP supported

**4.7 OAuth:**
- Google OAuth via `signInWithOAuth({ provider: 'google' })`
- Microsoft OAuth via `signInWithOAuth({ provider: 'azure' })`
- Auth callback detects new users → redirects to `/onboarding`

**4.11 Post Editing:**
- Inline edit in post-card.tsx with category selector
- Server action: `updatePost()` in posts.ts
- Real-time updates broadcast to all subscribers

---

## Final Navigation Structure

| Keep/Enhance | Build New | Delete/Redirect |
|--------------|-----------|-----------------|
| `/dashboard` | `/opportunities` | `/directory` → delete |
| `/calendar` | `/events/[id]` | `/board` → `/dashboard` |
| `/chat` | `/profile` | `/events` → `/calendar` |
| `/people` | `/settings` | `/jobs` → `/opportunities` |
| `/projects` | `/admin` | `/menu` → delete |
| `/projects/[id]` | | `/notes` → calendar |

---

## Summary by Complexity

| | 🟢 Small | 🟡 Medium | 🔴 Large | Total | Status |
|---|----------|-----------|----------|-------|--------|
| **Phase 1** | 8 | 0 | 0 | 8 | ✅ Complete |
| **Phase 2** | 4 | 6 | 1 | 11 | ✅ Complete |
| **Phase 3** | 7 | 6 | 2 | 15 | ✅ Complete |
| **Phase 4** | 9 | 7 | 0 | 16 | ✅ Complete |
| **Phase 5** | 2 | 2 | 1 | 5 | ✅ Complete |
| **Phase 6** | 2 | 4 | 1 | 7 | ⏳ On Hold |
| **Total** | **32** | **25** | **5** | **62** | |

---

## 🤖 AI Integration Points (Nice-to-Have)

The `🤖 AI Hook` column indicates where AI features could be added later. These are **optional enhancements** - build the feature first with coded logic, then optionally add AI.

| AI Hook | Feature | Task | Notes |
|---------|---------|------|-------|
| **Smart alerts** | "Based on your interests..." | 2.4 | Could personalize which alerts show first |
| **Smart notifs** | Personalized notification prioritization | 3.1 | Could rank notifications by relevance |
| **Event-Project link** | "This event relates to that project" | 3.6 | Could auto-suggest linking |
| **Notes summary** | Auto-generates action items from notes | 3.13 | Could parse meeting notes |

**When to build AI:** After Phase 4 is complete, if/when you add an API. Not required for MVP.

---

## Console.log Buttons to Fix

| Location | Button | Current Behavior | Task |
|----------|--------|------------------|------|
| `main-feed.tsx` | Post Submit | `console.log('Creating post:...')` - No DB call | 1.8 |
| `post-card.tsx` | Heart/Like | No DB call | 2.9 |
| `post-card.tsx` | Comments | No comments UI | 2.10 |
| `left-sidebar.tsx:150` | Community Highlights | `console.log('Clicked...')` | 2.7 |
| `right-sidebar.tsx:17` | Acknowledge Alert | Dismisses UI only | 3.14 |
| `event-card.tsx:354` | Comments | `console.log('Open comments')` | 3.4 |
| `event-card.tsx` | Navigate | `console.log('Navigate to event detail')` | 3.6 |
| `project-card.tsx` | Comments | `console.log('Open comments')` | 3.5 |

---

## Post System Features (Tasks 2.9-2.11, 3.15-3.16)

| Feature | Schema | Status | Task |
|---------|--------|--------|------|
| **Reactions** | ✅ `post_reactions` table | Wire up | 2.9 |
| **Comments** | ✅ `post_comments` table (threaded) | Build UI + backend | 2.10 |
| **@Mentions** | Partial | Persist to DB | 2.11 |
| **Pinning** | ✅ `is_pinned`, `pinned_at`, `pinned_by` | Admin-only UI | 3.15 |
| **Polls** | ❌ Need new schema | Full build | 3.16 |

### Polls Schema (to create for 3.16)
```sql
CREATE TABLE poll_options (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  option_text TEXT NOT NULL,
  position INT
);

CREATE TABLE poll_votes (
  poll_option_id UUID REFERENCES poll_options(id),
  user_id UUID REFERENCES auth.users(id),
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (poll_option_id, user_id)
);
```

---

## Publish to Website (Task 3.17)

**User Flow:**
1. When creating event/post/project, user sees "Publish to website" toggle
2. If toggled ON → item saved with `website_status: 'pending'`
3. Admin goes to `/admin/website-queue` → sees all pending items
4. Admin approves or rejects each item
5. If approved → API pushes to external website:
   - **Events** → public website calendar
   - **Posts/Projects** → public website highlights page

**Admin Approval Page: `/admin/website-queue`**
```
┌─────────────────────────────────────────────────────────────┐
│  Website Publishing Queue                    [3 pending]    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 EVENT: Community Food Drive                      │   │
│  │ Submitted by: Sarah @ Hope Foundation               │   │
│  │ Date: Dec 15, 2024                                  │   │
│  │ [Preview] [✓ Approve] [✗ Reject]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📝 POST: Youth Program Graduation Success           │   │
│  │ Submitted by: James @ Youth Alliance                │   │
│  │ Category: Wins                                      │   │
│  │ [Preview] [✓ Approve] [✗ Reject]                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Database Fields Needed:**
| Field | Type | Description |
|-------|------|-------------|
| `publish_to_website` | boolean | User toggled "publish to website" |
| `website_status` | enum | 'pending', 'approved', 'rejected' |
| `website_approved_at` | timestamp | When admin approved |
| `website_approved_by` | UUID | Admin who approved |
| `website_rejected_reason` | text | Optional rejection reason |

**API Endpoints for External Website:**
| Endpoint | Returns |
|----------|---------|
| `GET /api/public/events` | Approved events (for website calendar) |
| `GET /api/public/highlights` | Approved posts/projects (for highlights page) |

**Note:** The `/admin/website-queue` is a sub-route of the main admin page (3.11)

---

## User Feedback System (Task 3.18)

Simple in-app bug/issue reporting for test users.

**UI:**
- "Report Issue" button in header (or footer)
- Opens modal with: description textarea, optional screenshot upload, auto-captures current page URL

**Schema:**
```sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  page_url TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Admin View:** Simple list in `/admin` showing feedback with status toggles.

---

## Collaboration System - Current State

### What Exists (Backend Complete)
1. **Invite** → Org A creates event/project, invites Org B
2. **Notify** → Org B gets notification in `notifications` table
3. **Accept/Decline** → Via `respondToInvitation()`
4. **If Accepted** → Org B's ID added to `collaborating_orgs[]`

### What's Missing (To Build in 3.12)

| Gap | What's Needed |
|-----|---------------|
| Post-acceptance permissions | What can collaborators DO? |
| Collaborator posting | Can Org B post updates to Org A's project? |
| Remove collaborator | `removeCollaborator()` function |
| Collaboration roles | owner, co-organizer, supporter |
| My collaborations view | "Projects I'm collaborating on" |

### Proposed Permission Model
```
├── Owner (org that created it)
│   └── Full control: edit, delete, invite, remove
├── Co-organizer (invited with edit rights)
│   └── Can: post updates, edit details, invite others
│   └── Cannot: delete project, remove owner
└── Supporter (default when accepting)
    └── Can: post comments, view private details
    └── Cannot: edit project, invite others
```

---

## PHASE 5: User Onboarding & Admin Features ✅ COMPLETE

*New user onboarding flow and admin approval system*

### Implemented Features

| # | Task | Files | Complexity | Status |
|---|------|-------|------------|--------|
| 5.1 | **Onboarding Wizard** | `/src/components/onboarding/` | 🔴 Large | ✅ Done |
| 5.2 | **User Approval Workflow** | `user_profiles` + actions | 🟡 Medium | ✅ Done |
| 5.3 | **Admin Approvals Panel** | `/admin/approvals/` | 🟡 Medium | ✅ Done |
| 5.4 | **Pending Approval Page** | `/pending-approval/` | 🟢 Small | ✅ Done |
| 5.5 | **Dev Login Enhancements** | `dev-login.tsx` | 🟢 Small | ✅ Done |

### Phase 5 Implementation Details

**5.1 Onboarding Wizard (4-step flow):**
- Page: `/src/app/onboarding/page.tsx`
- Component: `/src/components/onboarding/onboarding-wizard.tsx`
- Actions: `/src/lib/actions/onboarding.ts`
- **Step 1:** Profile (name, job title, bio)
- **Step 2:** Organization selection (creates user_membership)
- **Step 3:** Skills & Interests (16 predefined each + social links)
- **Step 4:** Notification preferences
- Progress saved after each step

**5.2 User Approval Workflow:**
- Migration: `20260107000000_add_approval_status.sql`
- New enum: `approval_status` (pending, approved, rejected)
- New columns: `approval_status`, `approved_at`, `approved_by`, `rejection_reason`
- New users default to 'pending' after completing onboarding
- Admin notifications sent when new user completes onboarding

**5.3 Admin Approvals Panel:**
- Page: `/src/app/(authenticated)/admin/approvals/page.tsx`
- Actions: `/src/app/(authenticated)/admin/approvals/approval-actions.tsx`
- Server actions: `/src/lib/actions/admin.ts`
- Shows pending users with profile info
- Approve (with role selection) or Reject (with reason)
- Authorization: admin role only

**5.4 Pending Approval Page:**
- Page: `/src/app/pending-approval/page.tsx`
- Component: `/src/components/onboarding/pending-approval-content.tsx`
- Shows "Awaiting Approval" for pending users
- Shows "Application Not Approved" with reason for rejected users
- Redirects to /dashboard if already approved

**5.5 Dev Login Enhancements:**
- "Test Onboarding" button to simulate new user flow
- Role selector (admin, staff, partner, volunteer)
- Clears profile to force onboarding wizard

---

## PHASE 6: Future / On Hold

*Features deferred from earlier phases, plus optional AI enhancements.*

### Deferred Features (On Hold)

| # | Task | Original Phase | Complexity | Notes |
|---|------|----------------|------------|-------|
| 6.1 | **Build Opportunities Page** | Phase 3.7 | 🟡 Medium | `/opportunities` route |
| 6.2 | **Publish to Website** | Phase 3.17 | 🔴 Large | Admin queue, API integration |
| 6.3 | **Audit tables** | Phase 4.17 | 🟡 Medium | Track who changed what when |
| 6.4 | **Volunteer hours tracking** | Future | 🟡 Medium | Log volunteer time contributions |
| 6.5 | **Avatar upload in onboarding** | Future | 🟢 Small | Profile picture during Step 1 |
| 6.6 | **GDPR consent collection** | Future | 🟢 Small | Terms acceptance in onboarding |
| 6.7 | **Email notifications** | Future | 🟡 Medium | Resend integration for approvals |

### AI Features (Optional)

*Only if you add an API later. See [AI_FEATURES_ROADMAP.md](./AI_FEATURES_ROADMAP.md) for implementation details.*

| Feature | What It Does | Priority |
|---------|--------------|----------|
| Smart Notifications | "Based on your interests, check this event" | Nice-to-have |
| Event-Project Linking | "This event seems related to that project" | Nice-to-have |
| Meeting Notes Summary | Auto-generates action items from notes | Nice-to-have |

**Note:** Community highlights (task 2.7) is **coded**, not AI - shows real metrics like "3 events this week", pinned posts, etc.

---

## 🅿️ Parking Lot (Questions to Resolve Later)

### Architecture Gaps
| Question | Context | Priority |
|----------|---------|----------|
| Add `user_bookmarks` table? | Task 3.9 mentions bookmarks but no schema defined | Low |
| Standardize collab terminology? | Projects use `partner_orgs[]`, `collaborators[]`, `interested_orgs[]` - inconsistent | Low |
| Direct Project → Meeting Notes link? | Currently Project → Event → Meeting Note (indirect) | Low |
| Use skills/interests for anything? | Users have `skills[]` and `interests[]` but nothing queries them | Low |
| Duplicate event detection? | "This event looks similar to X" when creating | Low |
| Remove `connection_requests` table? | Everyone implicitly connected in building community - may not be needed | Low |

### Self-Improving AI Infrastructure
Not applicable for this project. True self-improving AI would require:
- Tracking accept/dismiss on recommendations
- Learning from user behavior over time
- ML model retraining pipelines

This is enterprise-level complexity. For Village Hub, simple coded logic + optional AI enhancements (Phase 5) is the right approach.

---

*End of Master Plan*
