# Phase 3 Complete Test Execution Prompt

Use this prompt to have an external AI model run all Phase 3 tests (Wave 1 + Wave 2).

---

## PROMPT FOR EXTERNAL AI

```
You are a QA test engineer. Your task is to run comprehensive validation tests for Phase 3 of the St Martins Village Hub application. This includes both Wave 1 and Wave 2 features.

## Phase 3 Features Overview

### Wave 1 Features (Database tests passing ✅)
1. **3.1 Notifications Dropdown** - Bell icon, dropdown, unread count
2. **3.8 Search** - Search page with posts, people, events, projects
3. **3.9 Profile Page** - User profile view and edit
4. **3.10 Settings Page** - Notification preferences and settings
5. **3.11 Admin Page** - Admin dashboard, user management, stats

### Wave 2 Features (Migrations need to be applied)
1. **3.6 Event Detail Page** - Full event view at /events/[id]
2. **3.14 Acknowledge Button** - Priority alerts acknowledgment
3. **3.15 Post Pinning** - Admin pin/unpin posts
4. **3.16 Polls** - WhatsApp-style polls
5. **3.18 User Feedback** - Feedback dialog
6. **Organization Profile** - /organizations/[id] with room location

---

## STEP 1: Environment Check

Verify prerequisites:

```bash
cd /Users/josh/stmartinsapp

# Check Node version (should be 18+)
node --version

# Check environment variables exist
cat .env.local | grep -E "SUPABASE_URL|SUPABASE_ANON_KEY|SERVICE_ROLE" | wc -l
# Should show 3

# Check dev server can start
npm run dev &
sleep 10
curl -s http://localhost:3000 | head -5
```

---

## STEP 2: Run Wave 1 Database Validation

```bash
npx tsx scripts/test-wave1-features.ts
```

**Expected Output:**
```
========================================
Phase 3 Wave 1 Feature Tests
========================================

[PASS] 3.8 Search - Posts query
[PASS] 3.9 Profile - Basic fetch
[PASS] 3.9 Profile - With organization join
[PASS] 3.10 Settings - Fetch
[PASS] 3.11 Admin - Stats queries
[PASS] 3.11 Admin - User management
[PASS] 3.11 Admin - Organizations list
[PASS] 3.11 Admin - User memberships
[PASS] 3.1 Notifications - Query
[PASS] 3.11 Admin - Website queue

Total: 10
Passed: 10
Failed: 0
```

**Report any failures.**

---

## STEP 3: Run Wave 2 Database Validation

```bash
npx tsx scripts/test-wave2-features.ts
```

**If migrations not applied, you'll see failures for:**
- polls, poll_options, poll_votes tables
- post_acknowledgments table
- user_feedback table
- organizations.room_location column

**To fix - Apply migrations:**
```bash
# Option 1: Push to remote Supabase
npx supabase db push

# Option 2: Run SQL manually in Supabase dashboard
# Copy contents from:
# - supabase/migrations/20251216010000_add_user_feedback.sql
# - supabase/migrations/20251216010100_add_org_room_location.sql
# - supabase/migrations/20251216010200_add_polls.sql
# - supabase/migrations/20251216030000_add_post_acknowledgments.sql
```

**Re-run after migrations:**
```bash
npx tsx scripts/test-wave2-features.ts
```

**Expected: 22 tests, all passing**

---

## STEP 4: Run Wave 1 Playwright E2E Tests

```bash
# Ensure dev server is running
npm run dev &

# Run Wave 1 E2E tests
npx playwright test tests/e2e/wave1-features.spec.ts --reporter=list
```

**Expected Tests (20 tests):**
- 3.1 Notifications: bell exists, dropdown opens, badge shows count
- 3.8 Search: page loads, input works, returns results, has tabs
- 3.9 Profile: page loads, shows user info, edit button, avatar
- 3.10 Settings: page loads, notification prefs, toggles, save button
- 3.11 Admin: page loads, shows stats, user management, restricted for non-admin
- Comprehensive Wave 1 test

**Report:**
- List passed/failed
- Screenshots at: test-screenshots/wave1/

---

## STEP 5: Run Wave 2 Playwright E2E Tests

```bash
npx playwright test tests/e2e/wave2-features.spec.ts --reporter=list
```

**Expected Tests (16 tests):**
- 3.6 Event Detail: navigation, content display, RSVP
- 3.14 Acknowledge: pinned posts show button, sidebar alerts
- 3.15 Post Pinning: pin option in menu, ordering, visual indicator
- 3.16 Polls: creation button, display with votes
- 3.18 User Feedback: header button, dialog opens
- Organization Profile: page loads, team members, room location
- Comprehensive Wave 2 test

**Report:**
- List passed/failed
- Screenshots at: test-screenshots/wave2/

---

## STEP 6: Run ALL E2E Tests Together

```bash
npx playwright test tests/e2e/wave1-features.spec.ts tests/e2e/wave2-features.spec.ts --reporter=list
```

---

## STEP 7: TypeScript Verification

```bash
npx tsc --noEmit 2>&1 | head -100
```

**Known Issues:**
- Missing type definitions for new tables (polls, poll_votes, etc.)
- Fix: Regenerate types after migrations applied

```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_REF \
  > src/lib/database.types.ts
```

---

## STEP 8: Manual Verification Checklist

### Wave 1 Manual Checks

#### 3.1 Notifications
- [ ] Bell icon visible in header
- [ ] Click opens dropdown
- [ ] Shows notification list or "All caught up"
- [ ] Badge shows unread count (if any)
- [ ] Clicking notification navigates correctly

#### 3.8 Search (/search)
- [ ] Search input visible
- [ ] Can type search query
- [ ] Results appear after search
- [ ] Category tabs work (Posts, People, Events, Projects)

#### 3.9 Profile (/profile)
- [ ] Page shows current user info
- [ ] Avatar displayed
- [ ] Name and bio visible
- [ ] Edit functionality works
- [ ] Can update profile fields

#### 3.10 Settings (/settings)
- [ ] Settings page loads
- [ ] Notification toggles visible
- [ ] Can change settings
- [ ] Changes persist after refresh

#### 3.11 Admin (/admin)
- [ ] Admin page loads for admin user
- [ ] Shows user stats
- [ ] User list visible
- [ ] Non-admin users redirected/blocked

### Wave 2 Manual Checks

#### 3.6 Event Detail (/events/[id])
- [ ] Clicking event card goes to detail page
- [ ] Shows event title, description
- [ ] Date/time displayed
- [ ] Location shown
- [ ] RSVP button works
- [ ] Attendee list visible

#### 3.14 Priority Alert Acknowledgment
- [ ] Pinned posts show acknowledge button
- [ ] Clicking acknowledge updates UI
- [ ] Shows acknowledgment count
- [ ] State persists on refresh

#### 3.15 Post Pinning
- [ ] Admin sees Pin/Unpin in post menu
- [ ] Pinned posts show "Pinned" badge
- [ ] Pinned posts appear first in feed
- [ ] Pin limit enforced (max 3)

#### 3.16 Polls
- [ ] Poll button in post composer
- [ ] Poll creation dialog opens
- [ ] Can add question and options
- [ ] Polls display with progress bars
- [ ] Can vote on poll
- [ ] Vote percentages update

#### 3.18 User Feedback
- [ ] Feedback button in header
- [ ] Dialog opens on click
- [ ] Can select feedback type
- [ ] Can enter description
- [ ] Submit works

#### Organization Profile (/organizations/[id])
- [ ] Page loads organization info
- [ ] Team members displayed
- [ ] Room location shown (if set)
- [ ] Admin can edit org details

---

## STEP 9: Create Final Report

Generate a comprehensive report:

### 1. Database Tests Summary
| Wave | Total | Passed | Failed |
|------|-------|--------|--------|
| Wave 1 | 10 | ? | ? |
| Wave 2 | 22 | ? | ? |

### 2. E2E Tests Summary
| Wave | Total | Passed | Failed |
|------|-------|--------|--------|
| Wave 1 | 20 | ? | ? |
| Wave 2 | 16 | ? | ? |

### 3. Manual Verification
- Wave 1: X/5 features verified
- Wave 2: X/6 features verified

### 4. Issues Found
List any issues discovered:
1. ...
2. ...

### 5. Blocking Issues
- [ ] None
- [ ] TypeScript errors (list)
- [ ] Missing migrations (list)
- [ ] Test failures (list)

### 6. Recommendations
1. ...
2. ...

### 7. Overall Status
- [ ] ✅ Ready for production
- [ ] ⚠️ Ready with minor fixes
- [ ] ❌ Blocking issues need resolution

---

## Quick Reference Commands

```bash
# Start dev server
npm run dev

# Wave 1 DB tests
npx tsx scripts/test-wave1-features.ts

# Wave 2 DB tests
npx tsx scripts/test-wave2-features.ts

# Wave 1 E2E tests
npx playwright test tests/e2e/wave1-features.spec.ts --reporter=list

# Wave 2 E2E tests
npx playwright test tests/e2e/wave2-features.spec.ts --reporter=list

# All E2E tests
npx playwright test tests/e2e/wave1-features.spec.ts tests/e2e/wave2-features.spec.ts --reporter=list

# TypeScript check
npx tsc --noEmit

# View screenshots
ls test-screenshots/wave1/
ls test-screenshots/wave2/

# Apply migrations
npx supabase db push

# Regenerate types
npx supabase gen types typescript --project-id PROJECT_REF > src/lib/database.types.ts
```

---

## File Locations

### Test Files
- `scripts/test-wave1-features.ts` - Wave 1 DB validation
- `scripts/test-wave2-features.ts` - Wave 2 DB validation
- `tests/e2e/wave1-features.spec.ts` - Wave 1 Playwright tests
- `tests/e2e/wave2-features.spec.ts` - Wave 2 Playwright tests

### Migration Files
- `supabase/migrations/20251216010000_add_user_feedback.sql`
- `supabase/migrations/20251216010100_add_org_room_location.sql`
- `supabase/migrations/20251216010200_add_polls.sql`
- `supabase/migrations/20251216030000_add_post_acknowledgments.sql`

### Screenshots
- `test-screenshots/wave1/` - Wave 1 E2E screenshots
- `test-screenshots/wave2/` - Wave 2 E2E screenshots

---

## Success Criteria

Phase 3 is complete when:
1. ✅ Wave 1 DB tests: 10/10 passing
2. ✅ Wave 2 DB tests: 22/22 passing (after migrations)
3. ✅ Wave 1 E2E tests: All passing
4. ✅ Wave 2 E2E tests: All passing
5. ✅ Manual verification: All items checked
6. ✅ TypeScript: No new errors
7. ✅ All migrations applied
```

---

## TROUBLESHOOTING

### Common Issues

**"Table does not exist"**
- Migrations not applied
- Run: `npx supabase db push`

**"Permission denied" / RLS errors**
- Check RLS policies in migration files
- Ensure user is authenticated

**Playwright timeout**
- Dev server not running
- Run: `npm run dev`

**Login failures**
- Check `.env.local` credentials
- Test dev-login API: `curl -X POST http://localhost:3000/api/dev-login`

**TypeScript errors**
- Regenerate types after migrations
- Some errors are expected until types regenerated

**Tests hang**
- Kill stale processes: `pkill -f playwright`
- Restart dev server
