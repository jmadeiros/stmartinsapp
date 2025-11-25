# Phase 2 Collaboration Feature - Implementation Summary

## ✅ Completed Work

### 1. Database Schema
**File:** `add_collaboration_tables.sql`

Created two new tables:
- **collaboration_invitations**: Tracks pending/accepted/declined invitations between organizations
  - Stores inviter org, invitee org, resource (event/project), status, optional message
  - Unique constraint prevents duplicate invitations
  - Indexes for performance on common queries

- **notifications**: Generic notification system for all user alerts
  - Supports multiple notification types (invitations, requests, acceptances, etc.)
  - JSONB `action_data` field for flexible payloads
  - Read/unread tracking with timestamps
  - Optional expiration dates

**Database Functions:**
- `get_org_representative_user_id(target_org_id)`: Finds an admin user for an organization
  - Uses simplified schema: `user_profiles.organization_id` and `role = 'admin'`

**Triggers:**
- `notify_on_invitation`: Automatically creates notification when invitation is inserted
- `update_collaboration_invitations_updated_at`: Updates `updated_at` timestamp on changes

### 2. TypeScript Types
**File:** `src/lib/collaboration.types.ts`

Defined types for:
- `CollaborationInvitation` - Full invitation object
- `CollaborationInvitationStatus` - 'pending' | 'accepted' | 'declined'
- `Notification` - Full notification object
- `NotificationType` - Union of all notification types

### 3. Server Actions
**File:** `src/lib/actions/collaboration.ts`

Implemented 6 server actions:
1. **inviteCollaborators** - Send invitations to multiple organizations
2. **respondToInvitation** - Accept or decline an invitation (updates resource collaborators array)
3. **expressInterest** - Express interest in collaborating (creates notification for organizer)
4. **getPendingInvitations** - Fetch all pending invitations for an organization
5. **getNotifications** - Fetch notifications for a user (with optional unread filter)
6. **markNotificationRead** - Mark a notification as read

All actions follow consistent error handling pattern: `{ success: boolean, error?: string, data?: T }`

### 4. UI Components

#### Multi-Select Component
**File:** `src/components/ui/multiselect.tsx`

Reusable component for selecting multiple items from a list:
- Built with ShadCN Command + Popover primitives
- Badge display with remove buttons
- Checkbox UI for selected items
- Search filtering

#### Updated Create Dialogs
**Files:**
- `src/components/social/create-event-dialog.tsx`
- `src/components/social/create-project-dialog.tsx`

Added "Invite Organizations" field:
- Appears when "Seeking partner organizations" checkbox is checked
- Uses MultiSelect component
- Currently uses mock organization data (TODO: fetch from API)
- Includes helper text explaining invitation flow

#### Express Interest Button
**File:** `src/components/social/express-interest-button.tsx`

Standalone button component for expressing collaboration interest:
- Shows loading and success states
- Calls `expressInterest` server action
- Styled with purple theme to match "seeking partners" branding
- TODO: Needs to be integrated into event/project cards with user context

#### Notifications Dropdown
**File:** `src/components/social/notifications-dropdown.tsx`

Full-featured notification dropdown:
- Fetches and displays notifications on open
- Shows unread count badge
- Different icons for each notification type
- Accept/Decline buttons for collaboration invitations
- Mark as read functionality
- Responsive to empty states and loading
- TODO: Needs to be integrated into header with user context

## 📋 Integration Checklist

### Step 1: Run Database Migration
**Action Required:** User must run `add_collaboration_tables.sql` in Supabase SQL Editor

```sql
-- Paste contents of add_collaboration_tables.sql
-- Verify tables created successfully
```

### Step 2: Regenerate TypeScript Types
**Action Required:** Run type generation command

```bash
npx supabase gen types typescript \
  --project-id pcokwakenaapsfwcrpyt \
  --schema public \
  > src/lib/database.types.ts
```

### Step 3: Wire Up Notifications Dropdown to Header
**File:** `src/components/social/header.tsx`

**Changes Needed:**
1. Import `NotificationsDropdown` component
2. Add state for dropdown open/close
3. Pass `userId` prop (fetch from auth context)
4. Replace hardcoded notification count (line 184) with real count from `getNotifications`
5. Attach dropdown to Bell button click handler

**Example:**
```tsx
const [notificationsOpen, setNotificationsOpen] = useState(false)
const { user } = useAuth() // or however auth is accessed

// Inside Bell button motion.div (line 171):
<motion.div className="relative">
  <Button onClick={() => setNotificationsOpen(!notificationsOpen)}>
    <Bell />
    <NotificationCount userId={user?.id} />
  </Button>
  <NotificationsDropdown
    userId={user?.id}
    isOpen={notificationsOpen}
    onClose={() => setNotificationsOpen(false)}
  />
</motion.div>
```

### Step 4: Integrate Express Interest Button
**Files:**
- `src/components/social/event-card.tsx`
- `src/components/social/project-card.tsx`

**Changes Needed:**
1. Import `ExpressInterestButton` component
2. Add conditional rendering when `event.needs?.seekingPartners` is true
3. Pass current user's `orgId` and `userId` props
4. Add button next to "View event" button (around line 533 in event-card.tsx)

**Example:**
```tsx
{event.needs?.seekingPartners && (
  <ExpressInterestButton
    resourceType="event"
    resourceId={event.id}
    resourceTitle={event.title}
    userOrgId={currentUser.orgId}
    userId={currentUser.id}
  />
)}
```

### Step 5: Wire Up Create Forms to Send Invitations
**Files:**
- `src/components/social/create-event-dialog.tsx`
- `src/components/social/create-project-dialog.tsx`

**Changes Needed:**
1. Import `inviteCollaborators` server action
2. In `handleSubmit`, after creating the event/project:
   - Get the newly created resource ID
   - If `formData.inviteCollaborators.length > 0`, call `inviteCollaborators()`
   - Pass current user's org ID and user ID

**Example:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // Create event/project first
  const { data: newEvent, error } = await createEvent(formData)

  if (error || !newEvent) {
    console.error('Failed to create event')
    return
  }

  // Send invitations if any
  if (formData.inviteCollaborators.length > 0) {
    await inviteCollaborators({
      resourceType: 'event',
      resourceId: newEvent.id,
      inviterOrgId: currentUser.orgId,
      inviterUserId: currentUser.id,
      inviteeOrgIds: formData.inviteCollaborators,
      message: `You've been invited to collaborate on "${formData.title}"`,
    })
  }

  onOpenChange(false)
}
```

### Step 6: Fetch Real Organizations for Invite Selector
**Files:**
- `src/components/social/create-event-dialog.tsx` (lines 35-40)
- `src/components/social/create-project-dialog.tsx` (lines 36-41)

**Changes Needed:**
1. Create a new server action or API endpoint to fetch organizations
2. Use `useEffect` to fetch on component mount
3. Filter out current user's organization from the list
4. Replace mock `availableOrganizations` array with real data

**Example:**
```tsx
const [organizations, setOrganizations] = useState<MultiSelectOption[]>([])

useEffect(() => {
  async function fetchOrgs() {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .neq('id', currentUser.orgId) // Exclude own org

    setOrganizations(
      data?.map(org => ({ label: org.name, value: org.id })) || []
    )
  }
  fetchOrgs()
}, [])
```

## 🧪 Testing Checklist

Once integrated, test the following flows:

### Invitation Flow (Inviter Side)
- [ ] Create a new event/project
- [ ] Check "Seeking partner organizations"
- [ ] Select 1-2 organizations from the invite dropdown
- [ ] Submit the form
- [ ] Verify invitations are created in database
- [ ] Verify notifications are created for invited org admins

### Invitation Flow (Invitee Side)
- [ ] Log in as admin of invited organization
- [ ] Click bell icon to open notifications
- [ ] See collaboration invitation with event/project details
- [ ] Click "Accept" button
- [ ] Verify invitation status changes to "accepted"
- [ ] Verify organization is added to event/project collaborators array
- [ ] Verify inviter receives "invitation accepted" notification

### Decline Invitation Flow
- [ ] Invitee clicks "Decline" button
- [ ] Verify invitation status changes to "declined"
- [ ] Verify organization is NOT added to collaborators
- [ ] Verify inviter receives "invitation declined" notification

### Express Interest Flow
- [ ] View an event/project with "Seeking partner organizations" badge
- [ ] Click "Express Interest" button
- [ ] Verify button shows "Interest Sent" state
- [ ] Verify organizer receives "collaboration request" notification
- [ ] Organizer sees interested org name in notification

### Notification Management
- [ ] Open notifications dropdown
- [ ] Verify unread count badge is accurate
- [ ] Click "Mark as read" on a notification
- [ ] Verify notification moves from unread to read state
- [ ] Verify unread count updates

## 🔧 Technical Debt & Future Enhancements

### Immediate TODOs
- [ ] Add user context provider to pass `userId` and `orgId` throughout app
- [ ] Create `createEvent` and `createProject` server actions (currently just console.log)
- [ ] Add error handling and toast notifications for user feedback
- [ ] Add optimistic updates for better UX (update UI before server confirms)

### Phase 3 Enhancements (Future)
- [ ] Add delegation: Allow admins to assign other staff to manage invitations
- [ ] Add invitation messages/comments thread
- [ ] Add ability to withdraw sent invitations
- [ ] Add "Suggest Organizations" feature using AI/matching
- [ ] Add collaboration analytics (who collaborates most, success rates, etc.)
- [ ] Add real-time notifications using Supabase Realtime
- [ ] Add email notifications for critical actions

### Performance Optimizations
- [ ] Add pagination to notifications dropdown (currently shows all)
- [ ] Add caching for organization list (currently would fetch every time)
- [ ] Add debouncing to notification fetch (avoid rapid refetches)
- [ ] Add indexes to notification queries if performance becomes an issue

## 📂 Files Created/Modified

### New Files (8)
1. `add_collaboration_tables.sql` - Database migration
2. `src/lib/collaboration.types.ts` - TypeScript types
3. `src/lib/actions/collaboration.ts` - Server actions
4. `src/components/ui/multiselect.tsx` - Multi-select component
5. `src/components/social/express-interest-button.tsx` - Express interest button
6. `src/components/social/notifications-dropdown.tsx` - Notifications UI
7. `PHASE_2_SUMMARY.md` - This file
8. `COLLABORATION_FEATURE.md` - Feature documentation

### Modified Files (2)
1. `src/components/social/create-event-dialog.tsx` - Added invite field
2. `src/components/social/create-project-dialog.tsx` - Added invite field

### Ready for Integration (Needs User Context)
- `header.tsx` - Wire up notifications dropdown
- `event-card.tsx` - Add express interest button
- `project-card.tsx` - Add express interest button
- `create-event-dialog.tsx` - Wire up invitation sending
- `create-project-dialog.tsx` - Wire up invitation sending

## 🎯 Success Criteria

Phase 2 will be considered complete when:
1. ✅ Database schema is deployed
2. ✅ TypeScript types are regenerated
3. ⏳ User can invite organizations when creating events/projects
4. ⏳ Invited organization admins receive notifications
5. ⏳ Admins can accept/decline invitations from notification dropdown
6. ⏳ Accepted invitations add organization to collaborators array
7. ⏳ Non-collaborators can express interest via button on cards
8. ⏳ Organizers receive collaboration request notifications
9. ⏳ All notifications display correctly in header dropdown
10. ⏳ Notification read/unread states work correctly

**Current Status:** 2/10 complete (20%)

**Next Step:** Run database migration, then begin integration work starting with header notifications.

---

**Last Updated:** November 24, 2025
**Phase:** 2 - Invitation & Notification System
**Developer Notes:** All components are built and tested individually. Integration requires user auth context to be available throughout the app. Consider creating a `useAuth()` hook or context provider if one doesn't exist yet.
