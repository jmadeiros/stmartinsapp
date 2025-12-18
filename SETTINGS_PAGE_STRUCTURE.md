# Settings Page Structure

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header (with back to dashboard link)                       │
│  Settings                                                    │
│  Manage your account settings and preferences               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  👤 Account                                                  │
│  Manage your account information and profile                │
├─────────────────────────────────────────────────────────────┤
│  Email: user@example.com                                    │
│  Full Name: John Doe                                        │
│  Role: Admin                                                │
│  ─────────────────────────────────────────                  │
│  [Edit Profile]                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔒 Change Password                                          │
│  Update your password to keep your account secure           │
├─────────────────────────────────────────────────────────────┤
│  New Password                                               │
│  [_______________________________________________]           │
│                                                              │
│  Confirm Password                                           │
│  [_______________________________________________]           │
│                                                              │
│  [Change Password]                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔔 Notifications                                            │
│  Control what notifications you receive                     │
├─────────────────────────────────────────────────────────────┤
│  Reactions                                       [Toggle ON] │
│  Get notified when someone likes your posts                 │
│  ─────────────────────────────────────────────              │
│  Comments                                        [Toggle ON] │
│  Get notified when someone comments on your posts           │
│  ─────────────────────────────────────────────              │
│  Mentions                                        [Toggle ON] │
│  Get notified when someone mentions you                     │
│  ─────────────────────────────────────────────              │
│  Event Updates                                   [Toggle ON] │
│  Get notified about RSVPs and event reminders               │
│  ─────────────────────────────────────────────              │
│  Project Updates                                 [Toggle ON] │
│  Get notified about project activity and milestones         │
│  ─────────────────────────────────────────────              │
│  Collaboration Invitations                       [Toggle ON] │
│  Get notified when invited to collaborate                   │
│  ─────────────────────────────────────────────              │
│  Priority Alerts ✓                          [Toggle LOCKED] │
│  Critical updates and security alerts (always enabled)      │
│  ─────────────────────────────────────────────              │
│  ℹ️  Email Notifications                                     │
│  Email notifications are coming soon. For now, you'll       │
│  receive all notifications in-app.                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🛡️ Privacy                                                  │
│  Control who can see your information                       │
├─────────────────────────────────────────────────────────────┤
│  ℹ️  Profile Visibility                                      │
│  Your profile is visible to all members of your             │
│  organization. This helps foster collaboration and          │
│  transparency within The Village Hub.                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🚪 Sign Out                                                 │
│  Sign out of your account on this device                    │
├─────────────────────────────────────────────────────────────┤
│  [Sign Out] (red destructive button)                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
SettingsPage (Client Component)
├── Container (max-w-4xl)
│   ├── Header
│   │   ├── Title
│   │   └── Description
│   │
│   └── Sections (space-y-6)
│       │
│       ├── Account Card
│       │   ├── CardHeader
│       │   │   ├── User Icon
│       │   │   ├── Title
│       │   │   └── Description
│       │   └── CardContent
│       │       ├── Email Display
│       │       ├── Full Name Display
│       │       ├── Role Display
│       │       ├── Separator
│       │       └── Edit Profile Button → Link to /profile
│       │
│       ├── Change Password Card
│       │   ├── CardHeader
│       │   │   ├── Lock Icon
│       │   │   ├── Title
│       │   │   └── Description
│       │   └── CardContent
│       │       ├── New Password Input
│       │       ├── Confirm Password Input
│       │       └── Change Password Button
│       │
│       ├── Notifications Card
│       │   ├── CardHeader
│       │   │   ├── Bell Icon
│       │   │   ├── Title
│       │   │   └── Description
│       │   └── CardContent
│       │       ├── Notification Toggles (7 types)
│       │       │   ├── Reactions Switch
│       │       │   ├── Comments Switch
│       │       │   ├── Mentions Switch
│       │       │   ├── Event Updates Switch
│       │       │   ├── Project Updates Switch
│       │       │   ├── Collaboration Switch
│       │       │   └── Priority Alerts Switch (disabled)
│       │       ├── Separator
│       │       ├── Email Info Banner
│       │       └── Saving Indicator (conditional)
│       │
│       ├── Privacy Card
│       │   ├── CardHeader
│       │   │   ├── Shield Icon
│       │   │   ├── Title
│       │   │   └── Description
│       │   └── CardContent
│       │       └── Profile Visibility Info Banner
│       │
│       └── Sign Out Card (border-destructive)
│           ├── CardHeader
│           │   ├── LogOut Icon
│           │   ├── Title (destructive color)
│           │   └── Description
│           └── CardContent
│               └── Sign Out Button (destructive variant)
```

## State Management

```typescript
// Local State
const [userId, setUserId] = useState<string | null>(null)
const [userEmail, setUserEmail] = useState<string | null>(null)
const [userProfile, setUserProfile] = useState<any>(null)
const [loading, setLoading] = useState(true)
const [saving, setSaving] = useState(false)
const [notifications, setNotifications] = useState<NotificationPreferences>({...})
const [newPassword, setNewPassword] = useState("")
const [confirmPassword, setConfirmPassword] = useState("")
const [changingPassword, setChangingPassword] = useState(false)
```

## Data Flow

```
┌─────────────────┐
│  User loads     │
│  /settings      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  useEffect on mount             │
│  1. Get user from Supabase Auth │
│  2. Load user profile           │
│  3. Load notification prefs     │
│  4. Set loading = false         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Render Settings UI             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  User toggles notification      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  1. Update local state          │
│     (optimistic update)         │
│  2. Call server action          │
│  3. Show toast notification     │
│  4. Handle errors (revert)      │
└─────────────────────────────────┘
```

## Server Actions Flow

```
Client (Settings Page)
    │
    ├──► getNotificationPreferences(userId)
    │    └──► Supabase: SELECT from user_settings
    │         └──► Return preferences or defaults
    │
    ├──► updateNotificationPreferences(userId, prefs)
    │    └──► Supabase: UPSERT into user_settings
    │         └──► Return success/error
    │
    ├──► getUserProfile(userId)
    │    └──► Supabase: SELECT from user_profiles
    │         └──► Return profile data
    │
    ├──► changePassword(newPassword)
    │    └──► Supabase Auth: updateUser({ password })
    │         └──► Return success/error
    │
    └──► signOut()
         └──► Supabase Auth: signOut()
              └──► Redirect to /login
```

## Notification Preference Logic

```typescript
// When toggling a preference
handleNotificationToggle(key, value) {
  if (key === 'priority_alerts') {
    // Show error toast - cannot disable
    return
  }

  // Optimistic update
  setNotifications({ ...notifications, [key]: value })

  // Save to database
  updateNotificationPreferences(userId, newPrefs)
    .then(() => {
      // Success toast
      toast({ title: "Preferences Saved" })
    })
    .catch(() => {
      // Error toast + revert
      setNotifications(oldNotifications)
      toast({ title: "Error", variant: "destructive" })
    })
}
```

## Password Change Logic

```typescript
handleChangePassword() {
  // Validation
  if (newPassword.length < 8) {
    toast({ title: "Password Too Short" })
    return
  }

  if (newPassword !== confirmPassword) {
    toast({ title: "Passwords Don't Match" })
    return
  }

  // Update password
  changePassword(newPassword)
    .then(() => {
      toast({ title: "Password Changed" })
      setNewPassword("")
      setConfirmPassword("")
    })
    .catch((error) => {
      toast({ title: "Error", variant: "destructive" })
    })
}
```

## Responsive Breakpoints

```css
/* Mobile First */
- Full-width cards
- Stacked sections
- Full-width buttons

/* sm: 640px */
- Buttons can be auto-width
- More padding

/* md: 768px */
- Cards get more spacing

/* lg: 1024px */
- Max container width (4xl = 896px)
- Optimal reading width
```

## Accessibility Features

- ✅ Semantic HTML (sections, headers, labels)
- ✅ Proper label associations (htmlFor)
- ✅ Focus management on inputs
- ✅ ARIA labels on switches
- ✅ Keyboard navigation
- ✅ Screen reader friendly
- ✅ Color contrast (AA compliant)
- ✅ Error messages
- ✅ Loading states

## Error Handling

```typescript
// All server actions follow this pattern
try {
  const result = await serverAction()
  if (result.error) {
    toast({ title: "Error", description: result.error, variant: "destructive" })
    return
  }
  // Success handling
  toast({ title: "Success", description: "..." })
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  })
}
```

## Toast Notification System

```typescript
// Success Toast
toast({
  title: "Preferences Saved",
  description: "Your notification preferences have been updated.",
})

// Error Toast
toast({
  title: "Error",
  description: "Failed to save preferences",
  variant: "destructive",
})

// Info Toast (Priority Alerts)
toast({
  title: "Priority Alerts Required",
  description: "Priority alerts cannot be disabled...",
  variant: "destructive",
})
```
