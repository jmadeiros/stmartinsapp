# Profile Page Implementation - Task 3.9

## Overview
A comprehensive user profile page has been built following LinkedIn/Facebook design patterns. Users can view any user's profile and edit their own.

## Files Created

### Server Actions
- **`/src/lib/actions/profile.ts`**
  - `getProfile(userId)` - Fetch user profile with organization details
  - `updateProfile(userId, updates)` - Update profile (authorized for own profile only)
  - `getCurrentUserProfile()` - Get current user's profile
  - `updateAvatar(userId, avatarUrl)` - Update avatar URL
  - `updateSkills(userId, skills)` - Update skills array
  - `updateInterests(userId, interests)` - Update interests array

### Pages
- **`/src/app/(authenticated)/profile/[id]/page.tsx`**
  - Dynamic route for profile viewing
  - URL pattern: `/profile/{userId}`
  - Checks authentication
  - Determines if viewing own profile
  - Passes profile data to ProfileView component

### Components
All components are in `/src/components/profile/`:

1. **`profile-view.tsx`** - Main container component
   - Orchestrates all sub-components
   - Responsive grid layout
   - Clean card-based design

2. **`profile-header.tsx`** - Header section
   - Large avatar with initials fallback
   - Name and job title
   - Organization badge
   - Role badge (color-coded)
   - Bio preview
   - "Edit Profile" button (own profile only)

3. **`profile-edit-dialog.tsx`** - Edit modal
   - Full-screen responsive dialog
   - Form sections:
     - Basic Information (name, job title, bio)
     - Contact Information (email, phone)
     - Social Links (LinkedIn - Twitter/Instagram pending DB migration)
     - Skills (tag-based input)
     - Interests (tag-based input)
   - Real-time validation
   - Toast notifications for success/error
   - Optimistic UI updates

4. **`profile-about.tsx`** - About section
   - Displays bio with preserved formatting
   - Only shows if bio exists

5. **`profile-skills.tsx`** - Skills & Interests section
   - Skills displayed as colored badges
   - Interests displayed as outline badges
   - Only shows if skills/interests exist

6. **`profile-contact.tsx`** - Contact information sidebar
   - Email (with mailto link)
   - Phone (with tel link)
   - LinkedIn (external link with icon)
   - Placeholder for Twitter/Instagram
   - Clean icon-based layout

7. **`index.ts`** - Barrel export for easy imports

## Features Implemented

### Required Fields (from PHASE3_DECISIONS.md)
- ✅ Full Name (required)
- ✅ Email (required) - via contact_email
- ✅ Job Title (required)
- ✅ Organization (required) - auto-populated, not editable
- ✅ Phone (optional)
- ✅ Bio (optional)
- ✅ Skills (optional) - as array of tags
- ✅ Interests (optional) - as array of tags
- ✅ LinkedIn URL (optional)
- ⚠️ Twitter URL (pending DB migration)
- ⚠️ Instagram URL (pending DB migration)

### User Experience
- ✅ Users can view other users' profiles
- ✅ Users can edit their own profile only
- ✅ LinkedIn/Facebook-style design
- ✅ Responsive layout (mobile, tablet, desktop)
- ✅ Clean card-based UI
- ✅ Role badges with color coding
- ✅ Avatar with fallback initials
- ✅ Social links open in new tab
- ✅ Toast notifications for actions
- ✅ Loading states during save
- ✅ Form validation

### Security
- ✅ Server-side authorization check (users can only edit their own profile)
- ✅ Authentication required to view profiles
- ✅ Protected fields (role, organization, user_id) cannot be updated
- ✅ Input sanitization via form validation

## Database Schema

### Current `user_profiles` Table Fields
```typescript
{
  user_id: string              // Primary key, FK to auth.users
  full_name: string            // Required
  job_title: string | null     // Optional
  bio: string | null           // Optional
  contact_email: string | null // Optional
  contact_phone: string | null // Optional (legacy)
  phone: string | null         // Optional
  linkedin_url: string | null  // Optional
  skills: string[] | null      // Optional array
  interests: string[] | null   // Optional array
  avatar_url: string | null    // Optional
  role: user_role              // Enum (admin, st_martins_staff, etc.)
  organization_id: string | null // FK to organizations
  visibility: string           // Profile visibility setting
  created_at: string           // Timestamp
  updated_at: string           // Timestamp
  last_active_at: string | null // Optional timestamp
}
```

### Missing Fields (Documented in DATABASE_MIGRATION_NEEDED.md)
- `twitter_url` - TEXT, nullable
- `instagram_url` - TEXT, nullable

## Usage Examples

### Viewing a Profile
Navigate to `/profile/{userId}` where `userId` is the user's UUID from `user_profiles.user_id`.

Example:
```
/profile/550e8400-e29b-41d4-a716-446655440000
```

### Editing Your Profile
1. Navigate to your own profile: `/profile/{your-user-id}`
2. Click "Edit Profile" button
3. Update fields in the dialog
4. Click "Save Changes"
5. Toast notification confirms success
6. Dialog closes and page updates

### From Other Components
Link to a user's profile from anywhere:

```tsx
import Link from 'next/link'

<Link href={`/profile/${user.user_id}`}>
  View Profile
</Link>
```

## Integration Points

### People Page
Update `/src/app/(authenticated)/people/page.tsx` and `/src/components/people/people-page.tsx` to link to profiles:

```tsx
<Link href={`/profile/${person.id}`}>
  <Button variant="outline">View Profile</Button>
</Link>
```

### Social Feed
Update post author names to link to profiles:

```tsx
<Link href={`/profile/${post.author_id}`}>
  {post.author_name}
</Link>
```

### Comments
Update comment author names similarly.

## Styling

### Design System Compliance
- Uses existing ShadCN UI components
- Follows Tailwind design tokens
- Matches existing card patterns
- Consistent with dashboard layout
- Responsive breakpoints aligned with other pages

### Color Coding
- **Admin role**: Primary variant (blue)
- **St Martins Staff**: Secondary variant (purple)
- **Other roles**: Outline variant (gray)

### Layout
- Max width: 1280px (5xl)
- Card-based sections
- 3-column grid on desktop (2 columns + sidebar)
- Single column on mobile
- 8px (2rem) spacing between sections

## Testing Checklist

### Manual Testing
- [ ] View own profile
- [ ] View another user's profile
- [ ] Edit profile - all fields
- [ ] Add/remove skills
- [ ] Add/remove interests
- [ ] Save changes successfully
- [ ] Cancel editing
- [ ] LinkedIn link opens in new tab
- [ ] Email link creates mailto
- [ ] Phone link creates tel
- [ ] Avatar displays correctly
- [ ] Initials fallback works
- [ ] Role badge displays correctly
- [ ] Organization displays correctly
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Toast notifications appear
- [ ] Loading states work
- [ ] Form validation works

### Edge Cases
- [ ] Profile with no bio
- [ ] Profile with no skills
- [ ] Profile with no interests
- [ ] Profile with no contact info
- [ ] Profile with no avatar
- [ ] Very long bio text
- [ ] Many skills/interests
- [ ] Invalid URLs in social links

## Future Enhancements

### After Database Migration
1. Run migration SQL from `DATABASE_MIGRATION_NEEDED.md`
2. Regenerate types
3. Uncomment Twitter/Instagram in `profile-contact.tsx`
4. Add Twitter/Instagram inputs in `profile-edit-dialog.tsx`

### Potential Features
- Avatar upload functionality
- Profile visibility settings UI
- Activity feed on profile
- User statistics (posts, comments, etc.)
- Endorsements/recommendations
- Profile completion percentage
- Social share buttons
- PDF export of profile

## Technical Notes

### Type Safety
All components use TypeScript with strict mode. Types are generated from Supabase schema.

### Performance
- Server-side rendering for initial load
- Client-side hydration for interactivity
- Optimized database queries with joins
- Revalidation of affected paths after updates

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus management in dialog
- Screen reader friendly

### Error Handling
- Database errors caught and displayed
- Unauthorized access prevented
- Network errors handled gracefully
- User-friendly error messages

## Files Modified

No existing files were modified. All new functionality is isolated in new files.

## Dependencies

All required dependencies already exist in package.json:
- `@radix-ui/react-dialog` - Dialog component
- `@radix-ui/react-avatar` - Avatar component
- `@radix-ui/react-label` - Form labels
- `lucide-react` - Icons
- `class-variance-authority` - Variant styling
- Existing toast implementation

---

**Status**: ✅ Complete and ready for testing
**Created**: 2025-12-15
**Task**: 3.9 - Build Profile Page
