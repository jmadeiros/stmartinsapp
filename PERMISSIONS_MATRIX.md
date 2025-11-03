# The Village Hub - User Roles & Permissions Matrix
## Complete Access Control Reference v1.0

---

## Table of Contents
1. [Role Definitions](#1-role-definitions)
2. [Feature Access Matrix](#2-feature-access-matrix)
3. [Content Permissions](#3-content-permissions)
4. [Administrative Capabilities](#4-administrative-capabilities)
5. [Special Cases & Exceptions](#5-special-cases--exceptions)
6. [Permission Checking Implementation](#6-permission-checking-implementation)

---

## 1. Role Definitions

### Role Hierarchy (Lowest to Highest)

```
VOLUNTEER
   ↓ (can do everything Volunteer can do, plus more)
PARTNER_STAFF
   ↓
ST_MARTINS_STAFF
   ↓
ADMIN
```

---

### 1.1 Volunteer

**Who:** Part-time volunteers across organizations, community members, interns

**Primary Use Cases:**
- Stay informed about building activities
- View announcements and events
- Participate in community discussions
- Apply for volunteer opportunities

**Access Philosophy:** Read-mostly with limited contribution rights

**Typical Permissions:**
- ✅ View all public content
- ✅ Comment on posts (approved)
- ✅ View events and calendar
- ✅ Use chat (send messages)
- ✅ View job postings
- ✅ Update own profile
- ❌ Create posts
- ❌ Create events
- ❌ Post job listings
- ❌ Access admin features

---

### 1.2 Partner Staff

**Who:** Employees and core volunteers of resident charity organizations

**Primary Use Cases:**
- Share organizational updates
- Coordinate events and activities
- Post job/volunteer opportunities
- Collaborate with other charities

**Access Philosophy:** Full contributor with creation rights

**Typical Permissions:**
- ✅ All Volunteer permissions, PLUS:
- ✅ Create posts (all categories)
- ✅ Create events
- ✅ Post job listings
- ✅ Upload meeting notes (for their org)
- ✅ Create media coverage entries (for their org)
- ✅ Edit own content
- ❌ Pin posts
- ❌ Moderate content
- ❌ Manage users
- ❌ Access admin panel

---

### 1.3 St Martins Staff

**Who:** Core building management staff, primary coordinators

**Primary Use Cases:**
- Manage building-wide communications
- Coordinate shared resources
- Moderate community content
- Support all organizations

**Access Philosophy:** Moderator + enhanced creator rights

**Typical Permissions:**
- ✅ All Partner Staff permissions, PLUS:
- ✅ Pin/unpin posts
- ✅ Edit any post (moderation)
- ✅ Delete inappropriate content
- ✅ Create building-wide announcements
- ✅ Manage lunch menu
- ✅ Manage weekly timetable
- ✅ View basic analytics
- ✅ Approve new user registrations
- ❌ Change user roles (except approve initial role)
- ❌ Delete users
- ❌ Access full admin panel

---

### 1.4 Admin

**Who:** System administrators, IT staff, senior building management (2-3 users max)

**Primary Use Cases:**
- Manage all users and permissions
- Configure system settings
- Access all content and features
- Troubleshoot issues

**Access Philosophy:** Full system access (God mode)

**Typical Permissions:**
- ✅ All St Martins Staff permissions, PLUS:
- ✅ Manage users (create, edit, delete, change roles)
- ✅ Manage organizations
- ✅ Access admin panel
- ✅ View audit logs
- ✅ Configure system settings
- ✅ Delete any content
- ✅ Access analytics dashboard
- ✅ Manage resource bookings (Phase 3)
- ✅ Everything

---

## 2. Feature Access Matrix

### Legend
- ✅ Full Access
- 👀 View Only
- ✏️ Create/Edit Own
- 🔒 No Access
- ⭐ Special Conditions Apply

---

### 2.1 Core Features

| Feature | Volunteer | Partner Staff | St Martins Staff | Admin |
|---------|-----------|---------------|------------------|-------|
| **Dashboard** | ✅ View | ✅ View | ✅ View | ✅ View |
| **User Profile (Own)** | ✅ Edit | ✅ Edit | ✅ Edit | ✅ Edit |
| **User Profile (Others)** | 👀 View | 👀 View | 👀 View | ✅ Edit |
| **User Directory** | 👀 View | 👀 View | 👀 View | ✅ Manage |
| **Search** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Notifications** | ✅ Own | ✅ Own | ✅ Own | ✅ Own |

---

### 2.2 Community Board

| Action | Volunteer | Partner Staff | St Martins Staff | Admin |
|--------|-----------|---------------|------------------|-------|
| **View Posts** | ✅ | ✅ | ✅ | ✅ |
| **Create Post** | 🔒 | ✅ | ✅ | ✅ |
| **Edit Own Post** | 🔒 | ✅ | ✅ | ✅ |
| **Edit Any Post** | 🔒 | 🔒 | ✅ | ✅ |
| **Delete Own Post** | 🔒 | ⭐ Within 1hr | ✅ | ✅ |
| **Delete Any Post** | 🔒 | 🔒 | ✅ | ✅ |
| **Pin/Unpin Post** | 🔒 | 🔒 | ✅ | ✅ |
| **Comment** | ✅ | ✅ | ✅ | ✅ |
| **React** | ✅ | ✅ | ✅ | ✅ |
| **Flag Content** | ✅ | ✅ | ✅ | N/A |

**Notes:**
- Volunteers can comment, but comments may be moderated
- Partner staff can create posts in all categories
- Only St Martins staff and Admin can pin posts

---

### 2.3 Events Calendar

| Action | Volunteer | Partner Staff | St Martins Staff | Admin |
|--------|-----------|---------------|------------------|-------|
| **View Events** | ✅ | ✅ | ✅ | ✅ |
| **Create Event** | 🔒 | ✅ | ✅ | ✅ |
| **Edit Own Event** | 🔒 | ✅ | ✅ | ✅ |
| **Edit Any Event** | 🔒 | 🔒 | ✅ | ✅ |
| **Delete Own Event** | 🔒 | ✅ | ✅ | ✅ |
| **Delete Any Event** | 🔒 | 🔒 | ✅ | ✅ |
| **Upload Attachments** | 🔒 | ✅ | ✅ | ✅ |
| **Manage Weekly Timetable** | 👀 View | 👀 View | ✅ Edit | ✅ Edit |
| **RSVP (Phase 2)** | ✅ | ✅ | ✅ | ✅ |
| **Export Calendar** | ✅ | ✅ | ✅ | ✅ |

---

### 2.4 Chat

| Action | Volunteer | Partner Staff | St Martins Staff | Admin |
|--------|-----------|---------------|------------------|-------|
| **View Public Channels** | ✅ | ✅ | ✅ | ✅ |
| **Send Messages** | ✅ | ✅ | ✅ | ✅ |
| **Edit Own Messages** | ⭐ Within 5min | ⭐ Within 5min | ✅ | ✅ |
| **Delete Own Messages** | ⭐ Within 5min | ⭐ Within 5min | ✅ | ✅ |
| **Delete Any Message** | 🔒 | 🔒 | ✅ | ✅ |
| **React to Messages** | ✅ | ✅ | ✅ | ✅ |
| **View Org Channels** | ⭐ Own org only | ⭐ Own org only | ✅ All | ✅ All |
| **Create Channels** | 🔒 | 🔒 | ✅ | ✅ |
| **Pin Messages** | 🔒 | 🔒 | ✅ | ✅ |
| **Upload Files (Phase 2)** | 🔒 | ✅ | ✅ | ✅ |

---

### 2.5 Jobs & Volunteering

| Action | Volunteer | Partner Staff | St Martins Staff | Admin |
|--------|-----------|---------------|------------------|-------|
| **View Job Postings** | ✅ | ✅ | ✅ | ✅ |
| **Apply (Phase 2)** | ✅ | ✅ | ✅ | N/A |
| **Post Job** | 🔒 | ✅ | ✅ | ✅ |
| **Edit Own Job** | 🔒 | ✅ | ✅ | ✅ |
| **Edit Any Job** | 🔒 | 🔒 | ✅ | ✅ |
| **Delete Own Job** | 🔒 | ✅ | ✅ | ✅ |
| **Delete Any Job** | 🔒 | 🔒 | ✅ | ✅ |

---

### 2.6 Meeting Notes

| Action | Volunteer | Partner Staff | St Martins Staff | Admin |
|--------|-----------|---------------|------------------|-------|
| **View Notes** | ✅ | ✅ | ✅ | ✅ |
| **Comment on Notes** | 🔒 | ✅ | ✅ | ✅ |
| **Create Notes** | 🔒 | 🔒 | ✅ | ✅ |
| **Edit Notes** | 🔒 | 🔒 | ✅ | ✅ |
| **Delete Notes** | 🔒 | 🔒 | ✅ | ✅ |
| **Download Notes** | ✅ | ✅ | ✅ | ✅ |

**Transparency Principle:** All meeting notes visible to all users for transparency

---

### 2.7 Lunch Menu

| Action | Volunteer | Partner Staff | St Martins Staff | Admin |
|--------|-----------|---------------|------------------|-------|
| **View Menu** | ✅ | ✅ | ✅ | ✅ |
| **Edit Menu** | 🔒 | 🔒 | ✅ | ✅ |
| **Download PDF** | ✅ | ✅ | ✅ | ✅ |

---

### 2.8 Media Coverage

| Action | Volunteer | Partner Staff | St Martins Staff | Admin |
|--------|-----------|---------------|------------------|-------|
| **View Articles** | ✅ | ✅ | ✅ | ✅ |
| **Submit Article** | 🔒 | ⭐ Own org | ✅ | ✅ |
| **Edit Own Submission** | 🔒 | ✅ | ✅ | ✅ |
| **Edit Any Article** | 🔒 | 🔒 | ✅ | ✅ |
| **Delete Article** | 🔒 | 🔒 | ✅ | ✅ |
| **Feature Article** | 🔒 | 🔒 | ✅ | ✅ |

---

### 2.9 Admin Panel

| Feature | Volunteer | Partner Staff | St Martins Staff | Admin |
|---------|-----------|---------------|------------------|-------|
| **Access Admin Panel** | 🔒 | 🔒 | 🔒 | ✅ |
| **User Management** | 🔒 | 🔒 | ⭐ Approve only | ✅ Full |
| **Organization Management** | 🔒 | 🔒 | 🔒 | ✅ |
| **System Settings** | 🔒 | 🔒 | 🔒 | ✅ |
| **Analytics Dashboard** | 🔒 | 🔒 | 👀 Basic | ✅ Full |
| **Audit Logs** | 🔒 | 🔒 | 🔒 | ✅ |
| **Content Moderation Queue** | 🔒 | 🔒 | ✅ | ✅ |

---

### 2.10 Resource Booking (Phase 3)

| Action | Volunteer | Partner Staff | St Martins Staff | Admin |
|--------|-----------|---------------|------------------|-------|
| **View Bookings** | ✅ | ✅ | ✅ | ✅ |
| **Create Booking** | 🔒 | ✅ | ✅ | ✅ |
| **Edit Own Booking** | 🔒 | ✅ | ✅ | ✅ |
| **Cancel Own Booking** | 🔒 | ✅ | ✅ | ✅ |
| **Cancel Any Booking** | 🔒 | 🔒 | ✅ | ✅ |
| **Manage Resources** | 🔒 | 🔒 | ✅ | ✅ |

---

## 3. Content Permissions

### 3.1 Ownership Rules

**Own Content:** Content where `author_id` or `organizer_id` matches the current user

**Organization Content:** Content where `organization_id` matches the user's organization

---

### 3.2 Edit/Delete Time Windows

| Role | Edit Window | Delete Window |
|------|-------------|---------------|
| **Volunteer** | N/A (can't create) | N/A |
| **Partner Staff** | Unlimited (own content) | 1 hour (own content) |
| **St Martins Staff** | Unlimited (any content) | Unlimited (any content) |
| **Admin** | Unlimited (any content) | Unlimited (any content) |

**Exception:** After 24 hours, editing major content (posts, events) requires a reason/comment to maintain transparency.

---

### 3.3 Content Creation Limits (Anti-Spam)

| Role | Posts/Day | Events/Day | Jobs/Month | Messages/Minute |
|------|-----------|------------|------------|-----------------|
| **Volunteer** | 0 | 0 | 0 | 10 |
| **Partner Staff** | 10 | 5 | 10 | 20 |
| **St Martins Staff** | 20 | 10 | Unlimited | 30 |
| **Admin** | Unlimited | Unlimited | Unlimited | Unlimited |

**Note:** These are soft limits that trigger warnings, not hard blocks. Admins can override.

---

## 4. Administrative Capabilities

### 4.1 User Management

| Capability | St Martins Staff | Admin |
|------------|------------------|-------|
| **View All Users** | ✅ | ✅ |
| **Approve New Users** | ✅ | ✅ |
| **Change User Role** | 🔒 | ✅ |
| **Deactivate User** | 🔒 | ✅ |
| **Delete User** | 🔒 | ✅ |
| **Reset User Password** | 🔒 | ✅ |
| **View User Activity** | ✅ Basic | ✅ Full |

---

### 4.2 Content Moderation

| Capability | St Martins Staff | Admin |
|------------|------------------|-------|
| **View Flagged Content** | ✅ | ✅ |
| **Hide Post** | ✅ | ✅ |
| **Delete Post** | ✅ | ✅ |
| **Ban User** | 🔒 | ✅ |
| **Warn User** | ✅ | ✅ |
| **View Moderation History** | ✅ | ✅ |

**Moderation Workflow:**
1. User flags content (or auto-flagged by system)
2. St Martins staff reviews and can hide/delete
3. If repeated offense, escalate to Admin for user ban

---

### 4.3 Organization Management

| Capability | St Martins Staff | Admin |
|------------|------------------|-------|
| **View Organizations** | ✅ | ✅ |
| **Create Organization** | 🔒 | ✅ |
| **Edit Organization** | 🔒 | ✅ |
| **Deactivate Organization** | 🔒 | ✅ |
| **Assign Users to Organization** | 🔒 | ✅ |

---

### 4.4 System Configuration

| Capability | St Martins Staff | Admin |
|------------|------------------|-------|
| **Edit Lunch Menu** | ✅ | ✅ |
| **Manage Chat Channels** | ✅ | ✅ |
| **Configure Notifications** | 🔒 | ✅ |
| **Manage Resources (Phase 3)** | ✅ | ✅ |
| **Export Data** | 🔒 | ✅ |
| **Import Data** | 🔒 | ✅ |

---

## 5. Special Cases & Exceptions

### 5.1 Cross-Organization Visibility

**Rule:** Users can see content from all organizations (transparency principle), but can only create content for their own organization (or unaffiliated content).

**Exception:** St Martins Staff and Admins can create content for any organization.

---

### 5.2 Private Chat Channels

**Organization Channels:**
- Only members of that organization can view/send messages
- St Martins Staff and Admins have access to all org channels (for support)

**Private Channels (Phase 2):**
- Only invited members can access
- Admins can view but should respect privacy unless moderation needed

---

### 5.3 Event Visibility

**All events are public** (visible to all users) by default.

**Future Enhancement (Phase 3):** Private events for specific organizations only.

---

### 5.4 User Approval Workflow

**New User Registration:**
1. User signs up with Microsoft/Google OAuth
2. User selects organization and desired role
3. Status = "Pending Approval"
4. St Martins Staff or Admin receives notification
5. Reviewer checks:
   - Email domain matches known organization
   - Role request is appropriate
   - User is legitimate (not spam)
6. Approve or reject
7. User receives email notification

**Auto-Approval (Optional):**
- If email domain matches known org domain (@charityalpha.org), auto-approve as Partner Staff

---

### 5.5 Emergency Admin Access

**Scenario:** All admins are unavailable, and urgent moderation is needed.

**Fallback:**
- St Martins Staff can temporarily escalate a trusted Partner Staff user to St Martins role
- Supabase dashboard access (for super emergencies)
- Contact Supabase support to reset admin password

---

## 6. Permission Checking Implementation

### 6.1 Frontend Permission Checks (UI Visibility)

```typescript
// hooks/usePermissions.ts
import { useUser } from '@/hooks/useUser';

export function usePermissions() {
  const { user } = useUser();

  const canCreatePost = () => {
    return ['admin', 'st_martins_staff', 'partner_staff'].includes(user?.role);
  };

  const canPinPost = () => {
    return ['admin', 'st_martins_staff'].includes(user?.role);
  };

  const canEditPost = (post: Post) => {
    if (['admin', 'st_martins_staff'].includes(user?.role)) return true;
    return post.author_id === user?.id;
  };

  const canDeletePost = (post: Post) => {
    if (['admin', 'st_martins_staff'].includes(user?.role)) return true;
    // Partner staff can delete own posts within 1 hour
    if (user?.role === 'partner_staff' && post.author_id === user?.id) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return new Date(post.created_at) > oneHourAgo;
    }
    return false;
  };

  const isAdmin = () => user?.role === 'admin';
  const isStMartinsStaff = () => ['admin', 'st_martins_staff'].includes(user?.role);
  const isPartnerStaff = () => ['admin', 'st_martins_staff', 'partner_staff'].includes(user?.role);

  return {
    canCreatePost,
    canPinPost,
    canEditPost,
    canDeletePost,
    isAdmin,
    isStMartinsStaff,
    isPartnerStaff,
  };
}

// Usage in component:
function PostCard({ post }: { post: Post }) {
  const { canEditPost, canDeletePost, canPinPost } = usePermissions();

  return (
    <div>
      <h3>{post.title}</h3>
      {canEditPost(post) && <button>Edit</button>}
      {canDeletePost(post) && <button>Delete</button>}
      {canPinPost() && <button>Pin</button>}
    </div>
  );
}
```

---

### 6.2 Backend Permission Checks (API Security)

**Always enforce permissions on the backend**, even if UI hides buttons.

```typescript
// app/api/posts/[id]/route.ts
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // Get post to check ownership
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', params.id)
    .single();

  if (!post) {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }

  // Permission check
  const canEdit =
    ['admin', 'st_martins_staff'].includes(userData.role) ||
    post.author_id === user.id;

  if (!canEdit) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with update...
}
```

---

### 6.3 Database-Level Security (Supabase RLS)

**Row Level Security is the final defense layer.**

```sql
-- Example: Posts table policy
CREATE POLICY "Users can edit own posts or admins can edit any"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    -- User is the author
    author_id = auth.uid()
    OR
    -- User is admin or St Martins staff
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'st_martins_staff')
    )
  );
```

**Defense in Depth:**
1. UI hides unauthorized actions (UX)
2. Frontend permission checks prevent accidental API calls (performance)
3. Backend API checks enforce business logic (security)
4. RLS policies ensure database integrity (ultimate security)

---

## Permission Audit Checklist

Before deploying each feature, verify:

- [ ] Frontend UI conditionally renders based on permissions
- [ ] API routes check user role and ownership
- [ ] RLS policies are active on all tables
- [ ] Tests cover permission edge cases
- [ ] Documentation updated with new permissions

---

## Role Migration Path

**Volunteer → Partner Staff:**
- Admin manually promotes in Admin Panel
- No automatic promotion

**Partner Staff → St Martins Staff:**
- Admin manually promotes
- Requires business justification

**St Martins Staff → Admin:**
- Existing Admin promotes
- Requires strong trust and technical competence

---

## Frequently Asked Questions

**Q: Can a Partner Staff member see posts from other organizations?**
A: Yes, all posts are visible to all users for transparency and community building.

**Q: Can volunteers create private chat channels?**
A: No, only St Martins Staff and Admins can create channels.

**Q: How long do users have to edit their comments?**
A: Partner Staff can edit comments indefinitely. Volunteers can edit within 5 minutes.

**Q: Can admins impersonate users?**
A: No, this is not implemented for privacy and security reasons. Admins can view data but not act as other users.

**Q: What happens to a user's content when their account is deleted?**
A: Content is soft-deleted (marked as deleted) but retained in database for 30 days, then hard-deleted. Or content can be anonymized (author set to "Deleted User").

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Next Review:** After Phase 1 user testing
