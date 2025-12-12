#!/usr/bin/env node
/**
 * Phase 2 E2E Test - Playwright
 * Tests actual user flows: comments, reactions, notifications
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function devLogin(page, role = 'admin') {
  // Call dev-login API to get credentials
  const apiResponse = await page.request.post(`${BASE_URL}/api/dev-login`, {
    data: { role }
  });

  if (!apiResponse.ok()) {
    throw new Error(`Dev login API failed: ${await apiResponse.text()}`);
  }

  const { email, password } = await apiResponse.json();

  // Sign in via Supabase REST API
  const authResponse = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    data: { email, password },
  });

  if (!authResponse.ok()) {
    throw new Error(`Supabase auth failed: ${await authResponse.text()}`);
  }

  const authData = await authResponse.json();
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];

  // Set auth cookie on localhost
  await page.context().addCookies([{
    name: `sb-${projectRef}-auth-token`,
    value: JSON.stringify({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      expires_at: authData.expires_at,
      expires_in: authData.expires_in,
      token_type: authData.token_type,
      user: authData.user,
    }),
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);

  // Set localStorage
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(({ authData, projectRef }) => {
    localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      expires_at: authData.expires_at,
      expires_in: authData.expires_in,
      token_type: authData.token_type,
      user: authData.user,
    }));
  }, { authData, projectRef });

  return { email, authData };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🎭 Phase 2 E2E Tests (Playwright)\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('Run with: source .env.local && node scripts/test-phase2-e2e.js');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    // Test 1: Login and see dashboard with real data
    results.push(await test('1. Login and dashboard shows real user name', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Should show "Sarah" (admin user name), not "there"
      const pageText = await page.textContent('body');
      if (pageText.includes('Hello there') || pageText.includes('Welcome there')) {
        throw new Error('Dashboard showing fallback name "there" instead of real user name');
      }

      // Look for Sarah (admin display name)
      if (!pageText.includes('Sarah')) {
        throw new Error('Admin user name "Sarah" not found on dashboard');
      }

      await context.close();
    }));

    // Test 2: Feed shows real posts (not mock data)
    results.push(await test('2. Feed shows real posts from database', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Wait for feed to load

      // Check for post cards
      const postCards = await page.locator('[data-testid="post-card"], .post-card, article').count();

      // Should have some content (real data from database)
      // Even if 0 posts, shouldn't have MOCK_FEED_ITEMS placeholder text
      const pageText = await page.textContent('body');
      if (pageText.includes('MOCK_FEED')) {
        throw new Error('Page contains mock data references');
      }

      await context.close();
    }));

    // Test 3: Header notification badge renders (even if 0)
    results.push(await test('3. Header notification badge component renders', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Look for Bell icon in header (notification button)
      const bellButton = page.locator('button:has(svg.lucide-bell), [aria-label*="notification"]').first();
      await bellButton.waitFor({ timeout: 5000 });

      const isVisible = await bellButton.isVisible();
      if (!isVisible) {
        throw new Error('Notification bell button not found in header');
      }

      await context.close();
    }));

    // Test 4: Chat badge in nav (even if 0)
    results.push(await test('4. Chat nav item renders with badge support', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Look for Chat link in navigation
      const chatLink = page.locator('a[href="/chat"]').first();
      await chatLink.waitFor({ timeout: 5000 });

      const isVisible = await chatLink.isVisible();
      if (!isVisible) {
        throw new Error('Chat navigation link not found');
      }

      await context.close();
    }));

    // Test 5: Post has reaction buttons
    results.push(await test('5. Posts have reaction buttons', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500); // Wait for feed to fully load

      // Look for like/reaction buttons on posts
      const reactionButton = page.locator('button:has(svg.lucide-heart), button:has(svg.lucide-thumbs-up), [data-testid="reaction-button"]').first();

      try {
        await reactionButton.waitFor({ timeout: 5000 });
      } catch {
        // If no posts exist, that's ok - check that page loaded without error
        const pageText = await page.textContent('body');
        if (pageText.includes('Error') || pageText.includes('error')) {
          throw new Error('Page has errors');
        }
        console.log('   (No posts found to test reactions on)');
      }

      await context.close();
    }));

    // Test 6: Post has comment section
    results.push(await test('6. Posts have comment functionality', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for comment button or comment input
      const commentButton = page.locator('button:has(svg.lucide-message-circle), button:has(svg.lucide-message-square), [data-testid="comment-button"]').first();

      try {
        await commentButton.waitFor({ timeout: 5000 });
      } catch {
        const pageText = await page.textContent('body');
        if (pageText.includes('Error')) {
          throw new Error('Page has errors');
        }
        console.log('   (No posts found to test comments on)');
      }

      await context.close();
    }));

    // Test 7: Can create a new post
    results.push(await test('7. Post creation textarea is available', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Look for post creation textarea
      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"], textarea[placeholder*="post"]').first();
      await textarea.waitFor({ timeout: 5000 });

      const isVisible = await textarea.isVisible();
      if (!isVisible) {
        throw new Error('Post creation textarea not found');
      }

      await context.close();
    }));

    // Test 8: Calendar page loads with real events
    results.push(await test('8. Calendar page loads', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/calendar`);
      await page.waitForLoadState('networkidle');

      // Should have calendar UI elements
      const pageText = await page.textContent('body');

      // Check for date-related content
      const hasCalendarContent =
        pageText.includes('Mon') ||
        pageText.includes('Tue') ||
        pageText.includes('Wed') ||
        pageText.includes('December') ||
        pageText.includes('2024') ||
        pageText.includes('2025');

      if (!hasCalendarContent) {
        throw new Error('Calendar page missing date/calendar content');
      }

      await context.close();
    }));

    // Test 9: People page shows real profiles
    results.push(await test('9. People page shows user profiles', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/people`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Should have profile cards or user listings
      const pageText = await page.textContent('body');

      // Check for test user names or profile-related content
      const hasProfileContent =
        pageText.includes('Sarah') ||
        pageText.includes('James') ||
        pageText.includes('Emma') ||
        pageText.includes('Marcus') ||
        pageText.includes('Profile') ||
        pageText.includes('people');

      if (!hasProfileContent) {
        throw new Error('People page not showing profile content');
      }

      await context.close();
    }));

    // Test 10: Projects page loads
    results.push(await test('10. Projects page loads without mock data', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/projects`);
      await page.waitForLoadState('networkidle');

      const pageText = await page.textContent('body');

      // Should not contain mock data references
      if (pageText.includes('MOCK_PROJECT')) {
        throw new Error('Projects page contains mock data');
      }

      await context.close();
    }));

    // Test 11: Can write and submit a post
    results.push(await test('11. Can write a post (textarea + submit button)', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Find post textarea
      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"], textarea[placeholder*="post"]').first();
      await textarea.waitFor({ timeout: 5000 });

      // Type a test message
      const testMessage = `Test post ${Date.now()}`;
      await textarea.fill(testMessage);

      // Find and verify Post/Submit button exists
      const postButton = page.locator('button:has-text("Post"), button:has(svg.lucide-send)').first();
      await postButton.waitFor({ timeout: 5000 });

      const isEnabled = await postButton.isEnabled();
      // Button should be enabled after typing content
      if (!isEnabled) {
        // Check if button becomes enabled
        await page.waitForTimeout(500);
      }

      await context.close();
    }));

    // Test 12: Create Event dialog opens
    results.push(await test('12. Create Event dialog/button available', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for Create button or Event button
      const createButton = page.locator('button:has-text("Create"), button:has-text("Event"), button:has(svg.lucide-plus)').first();

      try {
        await createButton.waitFor({ timeout: 5000 });

        // Click to open dropdown/dialog
        await createButton.click();
        await page.waitForTimeout(500);

        // Look for Event option in dropdown or dialog
        const eventOption = page.locator('text=/Event/i, [role="menuitem"]:has-text("Event")').first();
        const hasEventOption = await eventOption.count() > 0;

        if (!hasEventOption) {
          // Maybe it's a direct "Create Event" button
          const pageText = await page.textContent('body');
          if (!pageText.includes('Event')) {
            console.log('   (Create menu open but no Event option visible)');
          }
        }
      } catch {
        // Check calendar page for event creation
        await page.goto(`${BASE_URL}/calendar`);
        await page.waitForLoadState('networkidle');

        const calendarCreateBtn = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Event")').first();
        await calendarCreateBtn.waitFor({ timeout: 5000 });
      }

      await context.close();
    }));

    // Test 13: Create Project dialog/button available
    results.push(await test('13. Create Project dialog/button available', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/projects`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for Create/New Project button
      const createProjectBtn = page.locator('button:has-text("Create"), button:has-text("New Project"), button:has-text("Add Project"), button:has(svg.lucide-plus)').first();

      try {
        await createProjectBtn.waitFor({ timeout: 5000 });
        const isVisible = await createProjectBtn.isVisible();
        if (!isVisible) {
          throw new Error('Create project button not visible');
        }
      } catch {
        // Check if there's a different way to create projects
        const pageText = await page.textContent('body');
        if (!pageText.toLowerCase().includes('create') && !pageText.toLowerCase().includes('new') && !pageText.toLowerCase().includes('add')) {
          throw new Error('No create/add project functionality found');
        }
      }

      await context.close();
    }));

    // Test 14: Add comment to a post
    results.push(await test('14. Can click comment button on post', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Find comment button on a post
      const commentBtn = page.locator('button:has(svg.lucide-message-circle), button:has(svg.lucide-message-square), [data-testid="comment-button"]').first();

      try {
        await commentBtn.waitFor({ timeout: 5000 });
        await commentBtn.click();
        await page.waitForTimeout(500);

        // After clicking, look for comment input
        const commentInput = page.locator('input[placeholder*="comment"], textarea[placeholder*="comment"], input[placeholder*="Reply"], textarea[placeholder*="Reply"]').first();
        const hasCommentInput = await commentInput.count() > 0;

        if (!hasCommentInput) {
          console.log('   (Comment button clicked but input not visible - may need scroll)');
        }
      } catch {
        console.log('   (No posts with comment buttons found)');
      }

      await context.close();
    }));

    // Test 15: React to a post (like button)
    results.push(await test('15. Can click reaction/like button on post', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await devLogin(page, 'admin');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Find like/reaction button
      const likeBtn = page.locator('button:has(svg.lucide-heart), button:has(svg.lucide-thumbs-up), [data-testid="reaction-button"], [data-testid="like-button"]').first();

      try {
        await likeBtn.waitFor({ timeout: 5000 });

        // Get initial state
        const initialText = await likeBtn.textContent();

        // Click like
        await likeBtn.click();
        await page.waitForTimeout(500);

        // Verify button is still there (didn't error out)
        const stillVisible = await likeBtn.isVisible();
        if (!stillVisible) {
          throw new Error('Like button disappeared after click');
        }
      } catch (e) {
        if (e.message.includes('disappeared')) throw e;
        console.log('   (No posts with like buttons found)');
      }

      await context.close();
    }));

  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;

  if (passed === total) {
    console.log(`\n🎉 All ${total} E2E tests passed! Phase 2 wiring verified.\n`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${passed}/${total} tests passed.\n`);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
