# External Validation Prompt for Comments System

Use this prompt to have another AI model validate the Event and Project Comments implementation.

---

## Prompt for External AI Validator

```
I need you to validate a new comments feature implementation in a Next.js/Supabase application. Please run the Playwright tests and verify the implementation is correct.

## Context

A comments system has been added to both Events and Projects pages. The implementation includes:

1. **Database Tables**: `event_comments` and `project_comments` (created via Supabase migration)
2. **Server Actions**: CRUD operations in `src/lib/actions/event-comments.ts` and `src/lib/actions/project-comments.ts`
3. **UI Component**: Unified `CommentSection` component in `src/components/social/comment-section.tsx`
4. **Integration**: Comments added to `event-detail.tsx` and `project-detail.tsx`

## What to Validate

### 1. Run the Playwright Tests

```bash
# First, ensure dev server is running
npm run dev

# In another terminal, run the comment tests
npx playwright test tests/e2e/comments.spec.ts --headed
```

### 2. Manual Verification Checklist

After running tests, manually verify these scenarios:

**Event Comments:**
- [ ] Navigate to `/events` and click on any event
- [ ] Verify "Comments" section appears below event details
- [ ] Add a new comment - verify it appears immediately
- [ ] Click "Reply" on a comment - verify reply input appears
- [ ] Submit a reply - verify it appears indented under parent
- [ ] Click three-dot menu on your own comment - verify Edit/Delete options
- [ ] Edit a comment - verify "(edited)" badge appears
- [ ] Delete a comment - verify it disappears

**Project Comments:**
- [ ] Navigate to `/projects` and click on any project
- [ ] Verify "Comments" section appears in the main content area
- [ ] Add a new comment - verify it appears immediately
- [ ] Reply to a comment - verify threading works
- [ ] Edit/Delete your own comments

**Notifications:**
- [ ] Login as User A (admin@stmartins.dev / Password123!)
- [ ] Note any events they created
- [ ] Login as User B (staff@stmartins.dev / Password123!)
- [ ] Comment on User A's event
- [ ] Login back as User A
- [ ] Check notification bell - should see notification about the comment

### 3. Code Review Verification

Verify these files exist and contain the expected code:

```bash
# Check server actions exist
ls -la src/lib/actions/event-comments.ts
ls -la src/lib/actions/project-comments.ts

# Check component exists
ls -la src/components/social/comment-section.tsx

# Verify imports in detail pages
grep -n "CommentSection" src/components/social/event-detail.tsx
grep -n "CommentSection" src/components/social/project-detail.tsx
```

### 4. Database Verification

Run this script to verify tables exist:

```bash
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  // Check event_comments table
  const { data: ec, error: ecErr } = await supabase
    .from('event_comments')
    .select('id')
    .limit(1);
  console.log('event_comments table:', ecErr ? 'ERROR: ' + ecErr.message : 'OK');

  // Check project_comments table
  const { data: pc, error: pcErr } = await supabase
    .from('project_comments')
    .select('id')
    .limit(1);
  console.log('project_comments table:', pcErr ? 'ERROR: ' + pcErr.message : 'OK');
}
verify();
"
```

## Expected Test Results

The Playwright test suite should show:
- `Event Comments` tests: All passing (5 tests)
- `Project Comments` tests: All passing (3 tests)
- `Comment Notifications` tests: May be flaky due to async nature
- `Comment UI States` tests: All passing (3 tests)

## Report Format

Please provide your findings in this format:

### Test Execution Results
- Total tests run: X
- Passed: X
- Failed: X
- Skipped: X

### Manual Verification
- Event comments: PASS/FAIL (details)
- Project comments: PASS/FAIL (details)
- Notifications: PASS/FAIL (details)

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Any improvements suggested]

## Files Changed in This Implementation

1. `supabase/migrations/20251228100000_add_event_project_comments.sql` - Database migration
2. `src/lib/actions/event-comments.ts` - Event comment CRUD + notifications
3. `src/lib/actions/project-comments.ts` - Project comment CRUD + notifications
4. `src/components/social/comment-section.tsx` - Unified comment UI component
5. `src/components/social/event-detail.tsx` - Added CommentSection integration
6. `src/components/social/project-detail.tsx` - Added CommentSection integration
7. `src/app/(authenticated)/projects/[id]/page.tsx` - Added currentUserId prop passing
8. `tests/e2e/comments.spec.ts` - Playwright E2E tests
```

---

## Quick Start Commands

```bash
# 1. Start the dev server
npm run dev

# 2. Run all comment tests
npx playwright test tests/e2e/comments.spec.ts

# 3. Run tests with UI
npx playwright test tests/e2e/comments.spec.ts --ui

# 4. Run specific test
npx playwright test tests/e2e/comments.spec.ts -g "should add a new comment"

# 5. Run database validation scripts
npx tsx scripts/test-event-comments.ts
npx tsx scripts/test-project-comments.ts
```

## Test User Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@stmartins.dev | Password123! | Admin/Organizer |
| Staff | staff@stmartins.dev | Password123! | Staff member |

---

## Success Criteria

The implementation is considered successful if:

1. ✅ All Playwright tests pass (excluding known flaky notification tests)
2. ✅ Comments can be added to events and projects
3. ✅ Threaded replies work correctly
4. ✅ Edit/Delete functionality works for own comments
5. ✅ Comments persist after page refresh
6. ✅ Notifications are created when commenting on others' content
7. ✅ No TypeScript errors in the codebase
8. ✅ No console errors during normal operation
