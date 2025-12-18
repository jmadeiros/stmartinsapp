# Settings Feature Documentation

## Overview

The Settings page allows users to manage their account preferences, notification settings, and privacy options within The Village Hub application.

## Location

- **URL**: `/settings`
- **File**: `/src/app/(authenticated)/settings/page.tsx`
- **Server Actions**: `/src/lib/actions/settings.ts`

## Features

### 1. Account Section

Displays user account information and provides quick access to profile management:

- **Email Address**: User's registered email
- **Full Name**: User's display name
- **Role**: User's role in the organization (admin, staff, volunteer, etc.)
- **Edit Profile Button**: Links to `/profile` for editing profile details

### 2. Change Password Section

Allows users to update their password:

- **New Password Field**: Enter new password (minimum 8 characters)
- **Confirm Password Field**: Confirm the new password
- **Change Password Button**: Submit password change
- **Validation**: Checks password length and matching passwords

### 3. Notifications Section

Granular control over notification preferences:

#### Notification Types (All toggleable except Priority Alerts)

1. **Reactions** - Get notified when someone likes your posts
2. **Comments** - Get notified when someone comments on your posts
3. **Mentions** - Get notified when someone mentions you (@username)
4. **Event Updates** - Get notified about RSVPs and event reminders
5. **Project Updates** - Get notified about project activity and milestones
6. **Collaboration Invitations** - Get notified when invited to collaborate
7. **Priority Alerts** - Critical updates and security alerts (ALWAYS ON - cannot be disabled)

#### Features

- **Auto-save**: Preferences are automatically saved when toggled
- **Toast Notifications**: Confirmation when preferences are saved
- **Real-time Updates**: Changes take effect immediately
- **In-app Only**: Currently supports in-app notifications (email coming soon)

### 4. Privacy Section

Information about profile visibility:

- **Profile Visibility**: Profiles are visible to all organization members
- **Purpose**: Transparency note explaining why profiles are public within the organization

### 5. Sign Out Section

- **Sign Out Button**: Safely signs out the user and redirects to login page
- **Confirmation**: Uses destructive styling to indicate the action

## Technical Implementation

### Database Schema

Notification preferences are stored in the `user_settings` table:

```sql
-- Columns added in migration 20251215_add_notification_preferences.sql
notify_reactions boolean DEFAULT true
notify_comments boolean DEFAULT true
notify_mentions boolean DEFAULT true
notify_event_updates boolean DEFAULT true
notify_project_updates boolean DEFAULT true
notify_collaboration_invitations boolean DEFAULT true
```

### Server Actions

#### `getNotificationPreferences(userId: string)`

- Fetches user's notification preferences from database
- Returns default preferences if none exist
- Always sets `priority_alerts: true`

#### `updateNotificationPreferences(userId: string, preferences: NotificationPreferences)`

- Updates user's notification preferences
- Ensures `priority_alerts` is always true
- Auto-saves on every toggle
- Uses upsert to handle users without settings

#### `getUserProfile(userId: string)`

- Fetches user profile information from `user_profiles` table
- Used to display account information

#### `changePassword(newPassword: string)`

- Updates user's password using Supabase Auth
- Validates password requirements

#### `signOut()`

- Signs out the current user
- Clears session and redirects to login

### Type Definitions

```typescript
export type NotificationPreferences = {
  reactions: boolean
  comments: boolean
  mentions: boolean
  event_updates: boolean
  project_updates: boolean
  collaboration_invitations: boolean
  priority_alerts: boolean // Always true
}
```

## UI Components Used

- **Card**: Layout containers for each section
- **Switch**: Toggle controls for notification preferences
- **Input**: Text fields for password change
- **Button**: Action buttons throughout
- **Label**: Field labels
- **Separator**: Visual dividers
- **Icons**: Lucide icons (Bell, User, Lock, Shield, LogOut, Info, CheckCircle2)
- **Toast**: Notification feedback system

## User Experience

### Navigation

- **Access**: Click the user icon in the top-right header
- **Back Navigation**: Settings has back link to dashboard (via header)
- **Profile Link**: Edit Profile button navigates to `/profile`

### Auto-save Behavior

When a user toggles any notification preference:
1. UI updates immediately (optimistic update)
2. Server action is called to save to database
3. Success toast is shown
4. On error, UI reverts and error toast is shown

### Disabled Controls

- **Priority Alerts Toggle**: Visually disabled (opacity-50) and cannot be toggled
- **Tooltip on Priority Alerts**: Shows why it cannot be disabled

### Responsive Design

- **Mobile**: Full-width cards, stacked layout
- **Desktop**: Max-width container (4xl), comfortable spacing
- **Buttons**: Adapt from full-width on mobile to auto-width on desktop

## Future Enhancements

1. **Email Notifications**
   - Currently shows info banner: "Email notifications coming soon"
   - Will add email delivery option for each notification type

2. **Profile Editing**
   - Currently shows placeholder page
   - Will add full profile editing (avatar, bio, contact info, etc.)

3. **Notification Frequency**
   - Instant, hourly digest, daily digest options
   - Uses existing `notification_frequency` column

4. **Dark Mode**
   - Explicitly not needed per PHASE3_DECISIONS.md

5. **Additional Settings**
   - Language preferences
   - Timezone settings
   - Privacy controls (when/if needed)

## Testing Checklist

- [ ] Can access settings page from header user icon
- [ ] Account information displays correctly
- [ ] Can navigate to profile page
- [ ] Password change validates correctly (8+ chars, matching)
- [ ] Password change shows success toast
- [ ] Each notification toggle works independently
- [ ] Priority alerts toggle is disabled
- [ ] Preferences auto-save with toast confirmation
- [ ] Settings persist after page reload
- [ ] Sign out redirects to login page
- [ ] Mobile responsive design works
- [ ] Toast notifications display correctly

## Integration with Notification System

The notification preferences control which notifications are created in the `notifications` table:

1. When a notification-worthy event occurs (e.g., someone likes a post)
2. System checks the recipient's notification preferences
3. If the preference is enabled, notification is created
4. If the preference is disabled, notification is skipped
5. Priority alerts always bypass preferences and are always created

## Migration Instructions

To apply the database migration:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL migration file:
# supabase/migrations/20251215_add_notification_preferences.sql
```

## File Structure

```
src/
├── app/
│   └── (authenticated)/
│       ├── settings/
│       │   └── page.tsx                 # Main settings page
│       └── profile/
│           └── page.tsx                 # Profile page (placeholder)
├── lib/
│   └── actions/
│       └── settings.ts                  # Server actions for settings
└── components/
    └── ui/
        ├── use-toast.ts                 # Toast hook
        └── toaster.tsx                  # Toast component

supabase/
└── migrations/
    └── 20251215_add_notification_preferences.sql  # Database migration
```

## Related Files

- `/src/lib/actions/notifications.ts` - Notification creation and retrieval
- `/src/components/social/header.tsx` - Navigation to settings
- `/src/app/layout.tsx` - Toaster component provider
- `/src/lib/database.types.ts` - TypeScript types for database

## Support

For issues or questions:
1. Check TypeScript types in `database.types.ts`
2. Review server action logs in browser console
3. Verify database migration has been applied
4. Check Supabase dashboard for `user_settings` table structure
