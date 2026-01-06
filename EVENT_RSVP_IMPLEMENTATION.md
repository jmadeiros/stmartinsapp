# Event RSVP Implementation Summary

## Overview

This document summarizes the implementation of Event RSVP functionality for The Village Hub application. Users can now RSVP to events, provide support options, and event organizers receive notifications.

## Files Created/Modified

### 1. Created: `/src/lib/actions/event-rsvp.ts`

New server actions file containing three main functions:

#### `toggleEventRsvp(eventId: string)`
- **Purpose**: Toggle RSVP status for an event
- **Behavior**:
  - If user has already RSVPed: Removes RSVP (no notification sent)
  - If user hasn't RSVPed: Creates RSVP with status='going' and notifies event organizer
- **Returns**: `{ success: boolean, isRsvped: boolean, error: string | null }`
- **Database Operations**:
  - Checks for existing RSVP in `event_rsvps` table
  - INSERT or DELETE based on current status
  - Creates notification for event organizer (unless self-RSVP)

#### `getEventRsvpStatus(eventId: string)`
- **Purpose**: Get current user's RSVP status for an event
- **Returns**: `{ isRsvped: boolean, rsvpData: RsvpData | null, error: string | null }`
- **Use Case**: Called on component mount to show initial RSVP state

#### `updateEventRsvpSupport(eventId: string, supportOptions)`
- **Purpose**: Update support options for an existing RSVP
- **Support Options**:
  - `volunteer_offered`: User willing to volunteer
  - `participants_count`: Number of participants user can bring
  - `can_partner`: User's organization interested in partnership
- **Returns**: `{ success: boolean, error: string | null }`

#### `createRsvpNotification()` (private)
- **Purpose**: Create notification for event organizer when someone RSVPs
- **Notification Details**:
  - Type: `'rsvp'`
  - Reference Type: `'event'`
  - Title: `"{userName} is attending "{eventTitle}""`
  - Link: `/events/{eventId}`
  - Action Data: Contains actor name and event title
- **Rules**:
  - Does NOT notify if user RSVPs to their own event
  - Only called when creating RSVP (not when removing)

### 2. Modified: `/src/components/social/event-card.tsx`

Updated the EventCard component to integrate RSVP functionality:

#### New State
- `isLoadingRsvp`: Loading state for RSVP operations

#### New Imports
```typescript
import {
  toggleEventRsvp,
  getEventRsvpStatus,
  updateEventRsvpSupport
} from "@/lib/actions/event-rsvp"
```

#### Updated Functions

**`handleAttendToggle()`** (now async)
- Optimistically updates UI before server call
- Calls `toggleEventRsvp(event.id)`
- Opens support panel when RSVPing
- Reverts on failure
- Disables button while loading

**`handleCancelAttend()`** (now async)
- Calls `toggleEventRsvp(event.id)` to remove RSVP
- Resets support choices
- Closes support panel

**`handleSupportSubmit()`** (now async)
- Calls `updateEventRsvpSupport()` with selected options
- Maps UI state to database fields:
  - `supportChoices.volunteer` → `volunteer_offered`
  - `supportChoices.participantCount` → `participants_count`
  - `supportChoices.canPartner` → `can_partner`

#### New useEffect
```typescript
useEffect(() => {
  async function fetchRsvpStatus() {
    const { isRsvped, rsvpData } = await getEventRsvpStatus(event.id)
    setAttending(isRsvped)

    // Populate support choices if RSVP exists
    if (rsvpData) {
      setSupportChoices({
        volunteer: rsvpData.volunteer_offered || false,
        bringParticipants: !!rsvpData.participants_count,
        participantCount: rsvpData.participants_count ? String(rsvpData.participants_count) : "",
        canPartner: rsvpData.can_partner || false,
      })
    }
  }
  fetchRsvpStatus()
}, [event.id])
```

#### UI Updates
- RSVP button disabled while `isLoadingRsvp` is true
- Support panel buttons disabled during loading
- Optimistic UI updates for better UX

### 3. Created: `/scripts/test-event-rsvp.ts`

Test script to verify RSVP functionality:
- Creates RSVP
- Updates support options
- Checks notification creation
- Removes RSVP
- Verifies database state

## Database Schema

### `event_rsvps` Table
```typescript
{
  event_id: string          // FK to events.id
  user_id: string           // FK to auth.users.id
  org_id: string            // FK to organizations.id
  status: string            // 'going'
  volunteer_offered: boolean | null
  participants_count: number | null
  can_partner: boolean | null
  created_at: string
  updated_at: string
}
```

Primary Key: `(event_id, user_id)`

## User Flow

### 1. Initial State
- Component loads
- `getEventRsvpStatus()` fetches current RSVP status
- Button shows "RSVP" or "Going" based on status

### 2. User Clicks RSVP Button
- Button shows loading state
- UI optimistically updates to "Going"
- `toggleEventRsvp()` creates RSVP in database
- If not self-RSVP, notification sent to event organizer
- Support panel opens

### 3. User Selects Support Options (Optional)
- User checks volunteer, participants, or partnership options
- User clicks "Confirm & add to calendar"
- `updateEventRsvpSupport()` updates RSVP record

### 4. User Withdraws RSVP
- User clicks "Going" button or "Cancel" in panel
- UI optimistically updates to "RSVP"
- `toggleEventRsvp()` deletes RSVP from database
- NO notification sent on withdrawal
- Support choices reset

## Implementation Decisions

### ✅ Implemented
1. **Toggle Functionality**: Users can RSVP and un-RSVP freely
2. **No Withdrawal Notification**: Only initial RSVP creates notification
3. **Immediate Recording**: RSVP recorded before support options selected
4. **Lazy Status Check**: Status fetched on component mount
5. **Optimistic Updates**: UI updates immediately for better UX
6. **Self-RSVP Prevention**: No notification if user RSVPs to their own event
7. **Support Options**: Three types - volunteer, participants, partnership

### 🎯 Pattern Consistency
- Followed existing patterns from `/src/lib/actions/reactions.ts`
- Used same notification creation pattern from `/src/lib/queries/feed.ts`
- Maintained consistent error handling: `{ success, data, error }` pattern
- Used `supabase.auth.getUser()` for authentication
- Queried `user_memberships` table for `org_id`

## Testing

### Manual Testing Checklist
- [ ] Click RSVP button - should create RSVP and show "Going"
- [ ] Support panel opens after RSVP
- [ ] Select support options and confirm
- [ ] Click "Going" button again - should toggle panel
- [ ] Click "Cancel" - should remove RSVP
- [ ] Refresh page - RSVP state persists
- [ ] Check notifications for event organizer
- [ ] Verify no notification for self-RSVP

### Database Testing
Run test script:
```bash
npx tsx scripts/test-event-rsvp.ts
```

### Type Safety
All TypeScript type checks pass:
```bash
npm run type-check
# No errors in event-rsvp.ts or event-card.tsx
```

## Integration Points

### Notification System
- Type: `'rsvp'`
- Reference Type: `'event'`
- Links to: `/events/{eventId}`
- Appears in notifications dropdown
- Marked as unread by default

### Event Detail Page
The same server actions can be used on `/events/[id]/page.tsx` for:
- Displaying RSVP count
- Showing list of attendees
- Managing RSVPs from event detail page

### Analytics (Future)
Track RSVP metrics:
- Total RSVPs per event
- Volunteer commitments
- Expected participant counts
- Partnership interests

## Future Enhancements

### Potential Additions
1. **RSVP Count Display**: Show "X people going" on event cards
2. **Attendee List**: Show avatars of people who RSVPed
3. **Calendar Integration**: Actually add to user's calendar
4. **Email Reminders**: Send reminder before event
5. **Check-in Feature**: Mark attendance at event
6. **Waitlist**: Handle capacity limits
7. **RSVP History**: Track past RSVPs for user

### Database Optimizations
- Add index on `(event_id, user_id)` for faster lookups
- Add trigger to update event RSVP count
- Consider materialized view for RSVP analytics

## Notes

### Authentication
- Uses server-side Supabase client
- Requires authenticated user
- Gets user from `supabase.auth.getUser()`

### Organization Context
- RSVPs tied to user's primary organization
- Uses `user_memberships.is_primary = true`
- Stores `org_id` in RSVP record

### Error Handling
- Graceful degradation if server action fails
- UI reverts to previous state on error
- Console logging for debugging
- User-friendly error messages (can be enhanced)

## Related Files

### Dependencies
- `/src/lib/supabase/server.ts` - Server client factory
- `/src/lib/database.types.ts` - Type definitions
- `/src/lib/actions/reactions.ts` - Pattern reference
- `/src/lib/queries/feed.ts` - Notification pattern reference

### Components
- `/src/components/social/event-card.tsx` - Main RSVP UI
- `/src/components/social/event-detail.tsx` - Could integrate RSVPs
- `/src/components/social/main-feed.tsx` - Displays event cards

### Database Tables
- `events` - Event records
- `event_rsvps` - RSVP records
- `user_memberships` - User organization relationships
- `user_profiles` - User information
- `notifications` - RSVP notifications

---

**Implementation Date**: 2026-01-04
**Author**: Claude Code
**Status**: ✅ Complete and Ready for Testing
