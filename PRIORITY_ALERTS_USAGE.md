# Priority Alerts Acknowledgment - Usage Guide

## Quick Reference

### For Developers

#### Using the Server Actions

```typescript
import { acknowledgePost, hasUserAcknowledged, getPostAcknowledgments } from '@/lib/actions/posts'

// Acknowledge a post
const result = await acknowledgePost(postId)
if (result.success) {
  console.log('Post acknowledged successfully')
}

// Check if user acknowledged
const { data: hasAcked } = await hasUserAcknowledged(postId, userId)
if (hasAcked) {
  console.log('User has acknowledged this post')
}

// Get acknowledgment statistics
const { data } = await getPostAcknowledgments(postId)
if (data) {
  console.log(`${data.count} users acknowledged`)
  console.log('Users:', data.users) // Array of user objects
}
```

#### Database Queries

```typescript
// Direct Supabase query to check acknowledgments
const supabase = createClient()
const { data } = await supabase
  .from('post_acknowledgments')
  .select('*')
  .eq('post_id', postId)
  .eq('user_id', userId)
  .maybeSingle()

const hasAcknowledged = !!data
```

### For Users

#### How to Create a Priority Alert
1. Create a post normally
2. As an admin, click the post menu (three dots)
3. Select "Pin Post"
4. The post will appear in the right sidebar as a Priority Alert

#### How to Acknowledge an Alert
**Option 1 - Right Sidebar:**
1. Look for the Priority Alert card in the right sidebar
2. Click the "Acknowledge" button
3. The alert will disappear from your sidebar

**Option 2 - In Feed:**
1. Find the pinned post in your feed (marked with "Priority Alert" badge)
2. Click the "Acknowledge This Alert" button
3. You'll see a green confirmation message

#### Understanding Acknowledgment Status
- **Unacknowledged:** Yellow "Acknowledge This Alert" button visible
- **Acknowledged:** Green "You acknowledged this alert" message shown
- **Others' Acknowledgments:** Count shown (e.g., "5 people acknowledged")

### For Administrators

#### Monitoring Acknowledgments

```typescript
// Get all acknowledgments for a post
const { data } = await getPostAcknowledgments(postId)

if (data) {
  console.log(`Total: ${data.count}/${totalUsers} acknowledged`)

  data.users.forEach(user => {
    console.log(`- ${user.fullName} at ${user.acknowledgedAt}`)
  })
}
```

#### Finding Unacknowledged Users

```sql
-- Get users who haven't acknowledged a specific post
SELECT
  up.user_id,
  up.full_name,
  up.email
FROM user_profiles up
WHERE up.user_id NOT IN (
  SELECT user_id
  FROM post_acknowledgments
  WHERE post_id = 'YOUR_POST_ID'
)
AND up.org_id = 'YOUR_ORG_ID';
```

#### Analytics Queries

```sql
-- Get acknowledgment statistics
SELECT
  p.id,
  p.title,
  p.content,
  COUNT(pa.user_id) as acknowledgment_count,
  p.created_at
FROM posts p
LEFT JOIN post_acknowledgments pa ON p.id = pa.post_id
WHERE p.is_pinned = true
  AND p.deleted_at IS NULL
GROUP BY p.id
ORDER BY p.created_at DESC;

-- Get acknowledgment timeline
SELECT
  pa.acknowledged_at::date as date,
  COUNT(*) as acknowledgments_per_day
FROM post_acknowledgments pa
WHERE pa.post_id = 'YOUR_POST_ID'
GROUP BY date
ORDER BY date;
```

## Component Integration

### Adding Acknowledgment UI to Custom Components

```typescript
import { acknowledgePost, hasUserAcknowledged } from '@/lib/actions/posts'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function MyComponent({ postId, userId }) {
  const [hasAcked, setHasAcked] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check acknowledgment status on mount
  useEffect(() => {
    async function checkStatus() {
      const { data } = await hasUserAcknowledged(postId, userId)
      setHasAcked(data || false)
    }
    checkStatus()
  }, [postId, userId])

  // Handle acknowledgment
  const handleAcknowledge = async () => {
    setLoading(true)
    const result = await acknowledgePost(postId)
    if (result.success) {
      setHasAcked(true)
    }
    setLoading(false)
  }

  return (
    <div>
      {!hasAcked ? (
        <Button onClick={handleAcknowledge} disabled={loading}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Acknowledge
        </Button>
      ) : (
        <div className="text-green-600 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Acknowledged</span>
        </div>
      )}
    </div>
  )
}
```

## Configuration

### Styling Constants

```typescript
// Priority levels based on category
const PRIORITY_CONFIG = {
  high: {
    categories: ['wins', 'intros'],
    headerBg: 'bg-destructive',
    buttonBg: 'bg-destructive hover:bg-destructive/90',
    icon: Zap,
    label: 'Priority'
  },
  medium: {
    categories: ['opportunities', 'questions', 'learnings', 'general'],
    headerBg: 'bg-amber-500',
    buttonBg: 'bg-amber-500 hover:bg-amber-600',
    icon: AlertTriangle,
    label: 'Alert'
  }
}
```

### Feature Flags

```typescript
// Feature flag to enable/disable acknowledgments
const ENABLE_ACKNOWLEDGMENTS = true

// Show acknowledgment count threshold
const MIN_ACK_COUNT_TO_SHOW = 1

// Auto-hide acknowledged alerts from sidebar
const AUTO_HIDE_ACKNOWLEDGED = true
```

## Troubleshooting

### Common Issues

**Issue:** Acknowledgment button doesn't appear
- **Solution:** Verify the post is pinned (`is_pinned = true`)
- **Check:** User is authenticated

**Issue:** Acknowledgment count not updating
- **Solution:** Refresh the component or page
- **Check:** Database trigger/RLS policies are active

**Issue:** Cannot acknowledge (error)
- **Solution:** Check user has valid auth session
- **Check:** Verify RLS policies allow INSERT for authenticated users

**Issue:** Acknowledgments not persisting
- **Solution:** Check migration has been applied
- **Check:** Verify table exists: `SELECT * FROM post_acknowledgments LIMIT 1;`

### Debug Queries

```sql
-- Check if acknowledgment exists
SELECT * FROM post_acknowledgments
WHERE post_id = 'POST_ID' AND user_id = 'USER_ID';

-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'post_acknowledgments';

-- Check table structure
\d post_acknowledgments
```

## Best Practices

1. **Always check acknowledgment status** before showing the acknowledge button
2. **Show acknowledgment count** for transparency and social proof
3. **Provide visual feedback** during acknowledgment (loading state)
4. **Handle errors gracefully** with toast notifications
5. **Don't allow un-acknowledgment** - maintains accountability
6. **Optimize queries** - fetch acknowledgment data only for pinned posts

## Performance Considerations

- Acknowledgment checks are cached per component instance
- Bulk queries should use `IN` clause for multiple posts
- Indexes on post_id and user_id ensure fast lookups
- Consider pagination for acknowledgment user lists (if > 100 users)

---

**Last Updated:** December 17, 2025
