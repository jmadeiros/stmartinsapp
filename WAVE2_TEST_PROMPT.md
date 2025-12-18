# Wave 2 Test Execution Prompt

Use this prompt to have an external AI model run the Phase 3 Wave 2 tests.

---

## PROMPT FOR EXTERNAL AI

```
You are a QA test engineer. Your task is to run validation tests for Phase 3 Wave 2 features of the St Martins Village Hub application.

## Context

The following Wave 2 features have been implemented:
1. **3.6 Event Detail Page** - Full event detail view at /events/[id]
2. **3.14 Acknowledge Button** - Priority alerts acknowledgment persisted to DB
3. **3.15 Post Pinning** - Admin pin/unpin posts, pinned appear first in feed
4. **3.16 Polls** - WhatsApp-style polls with voting
5. **3.18 User Feedback** - Feedback dialog in header
6. **Organization Profile** - /organizations/[id] with team & room location

## Your Tasks

### Step 1: Run Database Validation Script

Run the database validation script to verify all tables and schemas exist:

```bash
cd /Users/josh/stmartinsapp
npx tsx scripts/test-wave2-features.ts
```

**Expected Output:**
- All 20+ tests should pass
- Tables verified: polls, poll_options, poll_votes, post_acknowledgments, user_feedback
- Columns verified: organizations.room_location, posts.is_pinned, posts.pinned_at, posts.pinned_by
- Joins verified: events with organizer, polls with options, etc.

**Report:**
- List any failed tests
- Note any missing tables or columns
- Identify RLS policy issues

### Step 2: Run Playwright E2E Tests

Run the Playwright E2E tests for Wave 2 features:

```bash
cd /Users/josh/stmartinsapp
npx playwright test tests/e2e/wave2-features.spec.ts --reporter=list
```

**Expected behavior:**
- Tests login as admin via dev-login API
- Navigate through event detail, organization profile pages
- Check for feedback button in header
- Verify pinned post indicators
- Check for poll creation button

**Report:**
- List passed/failed tests
- Screenshot locations (test-screenshots/wave2/)
- Any timeout or navigation errors

### Step 3: Manual UI Verification Checklist

After running automated tests, verify these manually:

#### Event Detail Page (/events/[id])
- [ ] Page loads without errors
- [ ] Event title and description shown
- [ ] Date/time displayed correctly
- [ ] Location information shown
- [ ] RSVP button visible
- [ ] Organizer info displayed
- [ ] Attendee list visible

#### Post Pinning (Dashboard)
- [ ] Pinned posts show "Pinned" badge
- [ ] Pinned posts appear first in feed
- [ ] Admin users see Pin/Unpin in post menu
- [ ] Non-admin users don't see Pin option

#### Priority Alert Acknowledgment
- [ ] Pinned posts show acknowledge button
- [ ] Clicking acknowledge updates UI
- [ ] Acknowledged state persists on refresh
- [ ] Acknowledgment count displayed

#### Polls
- [ ] Poll button visible in post composer
- [ ] Poll creation dialog opens
- [ ] Can add poll question and options
- [ ] Polls display with progress bars
- [ ] Vote percentages shown
- [ ] Can vote on polls

#### User Feedback
- [ ] Feedback button visible in header (MessageSquare icon)
- [ ] Dialog opens on click
- [ ] Feedback type selector works
- [ ] Description textarea accepts input
- [ ] Submit button enabled when form valid

#### Organization Profile (/organizations/[id])
- [ ] Page loads organization info
- [ ] Organization logo/name displayed
- [ ] Room location shown (if set)
- [ ] Team members section visible
- [ ] Admin/manager can edit room location

### Step 4: TypeScript Verification

```bash
cd /Users/josh/stmartinsapp
npx tsc --noEmit 2>&1 | head -50
```

**Known Issue:** Database types need regeneration. Report any NEW errors not related to type definitions.

### Step 5: Create Test Report

Create a summary report with:

1. **Database Tests Summary**
   - Total tests: X
   - Passed: X
   - Failed: X (list specific failures)

2. **E2E Tests Summary**
   - Total tests: X
   - Passed: X
   - Failed: X (list specific failures)
   - Screenshots location

3. **Manual Verification Summary**
   - Features verified: X/6
   - Issues found: (list)

4. **TypeScript Status**
   - Errors count
   - Blocking issues: Yes/No

5. **Overall Assessment**
   - Ready for production: Yes/No/With fixes
   - Critical issues: (list)
   - Recommended fixes: (list)

## Environment Requirements

- Node.js 18+
- Environment variables in `.env.local`:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
- Dev server running: `npm run dev`
- Playwright installed: `npx playwright install`

## File Locations

- E2E Tests: `tests/e2e/wave2-features.spec.ts`
- Validation Script: `scripts/test-wave2-features.ts`
- Screenshots: `test-screenshots/wave2/`

## Migration Files to Verify

Check these migrations exist in `supabase/migrations/`:
- `20251216010000_add_user_feedback.sql`
- `20251216010100_add_org_room_location.sql`
- `20251216010200_add_polls.sql`
- `20251216030000_add_post_acknowledgments.sql`

## Success Criteria

Wave 2 is considered complete when:
1. All database validation tests pass
2. All E2E tests pass (or only have pre-existing failures)
3. All manual verification items checked
4. No new TypeScript errors introduced
5. All migration files present
```

---

## QUICK START COMMANDS

```bash
# 1. Ensure dev server is running
npm run dev

# 2. In a new terminal, run database validation
npx tsx scripts/test-wave2-features.ts

# 3. Run Playwright tests (with dev server running)
npx playwright test tests/e2e/wave2-features.spec.ts --reporter=list

# 4. Check TypeScript
npx tsc --noEmit

# 5. View screenshots
ls -la test-screenshots/wave2/
```

---

## EXPECTED TEST OUTPUT

### Database Validation (Success)
```
========================================
Phase 3 Wave 2 Feature Validation Tests
========================================

--- 3.6 Event Detail Page ---
[PASS] 3.6 Events table query (45ms)
[PASS] 3.6 Event RSVPs table (32ms)
[PASS] 3.6 Event with organizer join (51ms)

--- 3.14 Priority Alert Acknowledgments ---
[PASS] 3.14 post_acknowledgments table exists (28ms)
[PASS] 3.14 Acknowledgments schema check (25ms)
[PASS] 3.14 Acknowledgments with post join (38ms)

--- 3.15 Post Pinning ---
[PASS] 3.15 Post pinning columns exist (22ms)
[PASS] 3.15 Pinned posts query (35ms)
[PASS] 3.15 Feed ordering (pinned first) (42ms)

--- 3.16 Polls ---
[PASS] 3.16 polls table exists (20ms)
[PASS] 3.16 poll_options table (18ms)
[PASS] 3.16 poll_votes table (19ms)
[PASS] 3.16 Poll with options join (45ms)
[PASS] 3.16 Poll votes counting (38ms)

--- 3.18 User Feedback ---
[PASS] 3.18 user_feedback table exists (22ms)
[PASS] 3.18 Feedback schema check (20ms)
[PASS] 3.18 Feedback with user join (35ms)

--- Organization Profile ---
[PASS] Org room_location column (25ms)
[PASS] Org with members join (48ms)

--- RLS Policy Tests ---
[PASS] RLS: post_acknowledgments accessible (15ms)
[PASS] RLS: polls accessible (14ms)
[PASS] RLS: user_feedback accessible (16ms)

========================================
Test Summary
========================================
Total: 21
Passed: 21
Failed: 0

✅ All Wave 2 validation tests passed!
```

### Playwright Tests (Success)
```
Running 15 tests using 1 worker

✓ 3.6 Event Detail Page > Event card click navigates to event detail page
✓ 3.6 Event Detail Page > Event detail page shows event information
✓ 3.6 Event Detail Page > Event detail page has RSVP functionality
✓ 3.14 Priority Alert Acknowledgment > Pinned posts show acknowledge button
✓ 3.14 Priority Alert Acknowledgment > Right sidebar shows priority alerts
✓ 3.15 Post Pinning > Admin can see pin option in post menu
✓ 3.15 Post Pinning > Pinned posts appear first in feed
✓ 3.15 Post Pinning > Pinned posts show visual indicator
✓ 3.16 Polls Feature > Poll creation button exists in post composer
✓ 3.16 Polls Feature > Polls display with vote options
✓ 3.18 User Feedback > Feedback button exists in header
✓ 3.18 User Feedback > Feedback dialog opens and can submit feedback
✓ Organization Profile Page > Organization profile page loads
✓ Organization Profile Page > Organization profile shows team members
✓ Organization Profile Page > Organization profile shows room location
✓ Comprehensive Wave 2 Test - All features in sequence

15 passed
```

---

## TROUBLESHOOTING

### "Table does not exist" errors
- Migrations not applied. Run: `npx supabase db push`

### "Permission denied" errors
- RLS policy issue. Check migration files include RLS policies.

### Playwright timeout errors
- Dev server not running. Start with: `npm run dev`
- Increase timeout in test file

### TypeScript errors about missing types
- Regenerate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/database.types.ts`

### Login failures in Playwright
- Check `.env.local` has correct Supabase credentials
- Verify dev-login API is working: `curl -X POST http://localhost:3000/api/dev-login`
