# Prompt for Running Phase 2 Playwright Tests

Use this prompt with another AI model to run the Phase 2 tests:

---

## Prompt Text

```
I need you to run Playwright end-to-end tests for Phase 2 features in a Next.js application.

### Context
The application is located at: /Users/josh/stmartinsapp
A Playwright test file already exists at: tests/e2e/phase2-features.spec.ts
This test file contains 7 test cases that verify Phase 2 features including:
- Badge counts (notifications and chat)
- Real data loading (removed mock data)
- Post reactions
- Post comments

### Prerequisites
1. Ensure the Next.js dev server is running on localhost:3000
   - If not running, start it with: cd /Users/josh/stmartinsapp && npm run dev
   - Wait for server to be ready (check http://localhost:3000)

2. Verify environment variables are set:
   - The .env.local file should exist with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   - The tests use these for authentication

### Task
Run the Playwright tests and provide a detailed summary of results.

### Commands to Execute

1. First, verify the test file exists:
   ```bash
   ls -la /Users/josh/stmartinsapp/tests/e2e/phase2-features.spec.ts
   ```

2. Run all Phase 2 tests:
   ```bash
   cd /Users/josh/stmartinsapp
   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/phase2-features.spec.ts --workers=1 --reporter=list --timeout=180000
   ```

3. If you want to run a specific test, use:
   ```bash
   npx playwright test tests/e2e/phase2-features.spec.ts -g "Phase 2.6" --workers=1
   ```

### What to Report

After running the tests, provide:

1. **Test Execution Summary**
   - Total tests run
   - Number passed/failed/skipped
   - Total execution time

2. **Detailed Results for Each Test**
   - Test name
   - Status (passed/failed)
   - Key findings
   - Any errors or warnings
   - Screenshot locations (if any)

3. **Issues Found**
   - List any failures
   - Root causes if identifiable
   - Database errors
   - UI interaction issues

4. **Screenshot Analysis** (if screenshots were generated)
   - Location: test-screenshots/phase2/
   - Review key screenshots and describe what they show
   - Verify that expected UI elements are visible
   - Check if data is displaying correctly

5. **Verification Checklist**
   For each test, confirm:
   - ✅ User name "Sarah" appears (not "there")
   - ✅ No mock data indicators found
   - ✅ Real Supabase data is loading
   - ✅ UI elements are visible and interactive
   - ✅ Badge counts display correctly
   - ⚠️ Any partial implementations or missing features

### Expected Test Cases

The test file should contain these 7 tests:
1. Phase 2.5: Badge Counts - Notification bell shows unread count and opens dropdown
2. Phase 2.5: Badge Counts - Chat badge shows unread count in nav
3. Phase 2.6: Remove Mock Feed - Dashboard shows real user name "Sarah" not "there"
4. Phase 2.8: Remove Mock Projects - Projects page loads from real Supabase
5. Phase 2.9: Post Reactions - Click heart/like button toggles reaction
6. Phase 2.10: Post Comments - Click comment button, type comment, submit
7. Comprehensive Phase 2 Test - All features in sequence

### Important Notes

- Tests use dev-login API endpoint: POST /api/dev-login with { role: "admin" }
- Tests authenticate using Supabase REST API
- Tests take screenshots automatically (saved to test-screenshots/phase2/)
- Some tests may fail due to:
  - Database schema issues (missing tables)
  - React state update issues in test environment
  - Missing onClick handlers

### Output Format

Please provide your results in a structured format similar to:

```
## Test Execution Results

**Date:** [timestamp]
**Environment:** localhost:3000
**Total Tests:** X
**Passed:** Y
**Failed:** Z
**Skipped:** W

### Test 1: [Name]
- Status: ✅ PASSED / ❌ FAILED
- Findings: [details]
- Screenshots: [paths]

[Repeat for each test]

### Summary
[Overall assessment]
```

### Troubleshooting

If tests fail:
1. Check if dev server is running: `curl http://localhost:3000`
2. Verify .env.local exists and has required variables
3. Check browser console errors in test output
4. Review screenshots in test-screenshots/phase2/
5. Check test-results/ folder for detailed error messages

Run the tests and provide a comprehensive analysis of the results.
```

---

## Alternative Shorter Prompt

If you need a more concise version:

```
Run Playwright tests at /Users/josh/stmartinsapp/tests/e2e/phase2-features.spec.ts

Prerequisites:
- Next.js dev server running on localhost:3000
- .env.local file with Supabase credentials

Command:
cd /Users/josh/stmartinsapp && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/phase2-features.spec.ts --workers=1 --reporter=list --timeout=180000

Report:
- Test pass/fail counts
- Detailed results for each test
- Screenshot analysis (check test-screenshots/phase2/)
- Issues found and root causes
- Verification that Phase 2 features work correctly
```

---

## Quick Reference Commands

```bash
# Check if test file exists
ls tests/e2e/phase2-features.spec.ts

# Run all tests
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/phase2-features.spec.ts --workers=1

# Run specific test
npx playwright test tests/e2e/phase2-features.spec.ts -g "Phase 2.6"

# View screenshots
ls -la test-screenshots/phase2/

# View test results HTML report (if generated)
npx playwright show-report
```




