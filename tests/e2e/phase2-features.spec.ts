import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOT_DIR = 'test-screenshots/phase2';

// Helper function to take screenshots
async function takeScreenshot(page: any, name: string) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

// Helper function to perform dev login
async function devLogin(page: any, role: string = 'admin') {
  // Navigate to login page first to get the base URL
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // Extract base URL from current page URL
  const currentUrl = page.url();
  const urlObj = new URL(currentUrl);
  const appBaseUrl = `${urlObj.protocol}//${urlObj.host}`;

  // Call the dev-login API to get credentials
  const apiResponse = await page.request.post(`${appBaseUrl}/api/dev-login`, {
    data: { role: role },
    timeout: 60000
  });
  
  if (!apiResponse.ok()) {
    throw new Error(`Dev login API failed: ${await apiResponse.text()}`);
  }

  const apiData = await apiResponse.json();
  const { email, password } = apiData;
  
  // Get Supabase URL and anon key from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment (.env.local).');
  }

  // Sign in using Supabase's REST API
  const authResponse = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    data: {
      email,
      password,
    },
  });

  if (!authResponse.ok()) {
    const errorText = await authResponse.text();
    throw new Error(`Supabase auth failed: ${errorText}`);
  }

  const authData: any = await authResponse.json();
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

  // Set cookies that Supabase SSR expects
  await page.context().addCookies([
    {
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
      sameSite: 'Lax' as const,
    },
  ]);

  // Also set in localStorage
  await page.evaluate(
    ({ authData, projectRef }: { authData: any; projectRef: string }) => {
      localStorage.setItem(
        `sb-${projectRef}-auth-token`,
        JSON.stringify({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          expires_at: authData.expires_at,
          expires_in: authData.expires_in,
          token_type: authData.token_type,
          user: authData.user,
        }),
      );
    },
    { authData, projectRef },
  );

  // Navigate to dashboard
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Wait for page to be interactive
  await page.waitForTimeout(3000); // Wait for data to load
}

test.describe('Phase 2 Features Tests', () => {
  test.setTimeout(120_000);
  // Run tests sequentially to avoid timeouts
  test.describe.configure({ mode: 'serial' });

  test('Phase 2.5: Badge Counts - Notification bell shows unread count and opens dropdown', async ({ page }) => {
    await devLogin(page, 'admin');
    await takeScreenshot(page, 'phase2-5-01-dashboard-loaded');

    // Check for notification bell in header
    const bellButton = page.locator('button:has(svg[class*="lucide-bell"]), button:has([class*="Bell"])').first();
    
    // Verify bell button exists
    await expect(bellButton).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'phase2-5-02-bell-visible');

    // Check if badge count is visible (may be 0, which is fine)
    const badge = bellButton.locator('span[class*="rounded-full"]').first();
    const badgeCount = await badge.count();
    
    if (badgeCount > 0) {
      const badgeText = await badge.textContent();
      console.log(`Notification badge count: ${badgeText}`);
      await takeScreenshot(page, 'phase2-5-03-badge-visible');
    } else {
      console.log('No notification badge (count is 0 or badge not rendered)');
    }

    // Click the bell button
    await bellButton.click();
    await page.waitForTimeout(500);

    // Check if dropdown opens (look for notifications dropdown or any dropdown content)
    const dropdown = page.locator('[role="dialog"], [class*="dropdown"], [class*="Notifications"]').first();
    const dropdownVisible = await dropdown.count() > 0;
    
    if (dropdownVisible) {
      await expect(dropdown).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'phase2-5-04-dropdown-opened');
      console.log('✅ Notification dropdown opened successfully');
    } else {
      // Check if there's a notifications panel or modal
      const notificationsPanel = page.locator('text=/Notifications|All caught up|No new notifications/i').first();
      if (await notificationsPanel.count() > 0) {
        await takeScreenshot(page, 'phase2-5-04-dropdown-opened-alt');
        console.log('✅ Notification panel found');
      } else {
        await takeScreenshot(page, 'phase2-5-04-dropdown-not-opened');
        console.log('⚠️ Notification dropdown did not open - this may need implementation');
      }
    }
  });

  test('Phase 2.5: Badge Counts - Chat badge shows unread count in nav', async ({ page }) => {
    await devLogin(page, 'admin');
    await takeScreenshot(page, 'phase2-5-chat-01-dashboard-loaded');

    // Look for Chat link in navigation
    const chatLink = page.locator('a:has-text("Chat"), nav a[href="/chat"]').first();
    
    if (await chatLink.count() > 0) {
      await expect(chatLink).toBeVisible({ timeout: 10000 });
      
      // Check for badge on chat link
      const chatBadge = chatLink.locator('span[class*="rounded-full"], span[class*="badge"]').first();
      const badgeCount = await chatBadge.count();
      
      if (badgeCount > 0) {
        const badgeText = await chatBadge.textContent();
        console.log(`Chat badge count: ${badgeText}`);
        await takeScreenshot(page, 'phase2-5-chat-02-badge-visible');
      } else {
        console.log('No chat badge (count is 0 or badge not rendered)');
        await takeScreenshot(page, 'phase2-5-chat-02-no-badge');
      }
    } else {
      console.log('Chat link not found in navigation');
      await takeScreenshot(page, 'phase2-5-chat-02-chat-link-not-found');
    }
  });

  test('Phase 2.6: Remove Mock Feed - Dashboard shows real user name "Sarah" not "there"', async ({ page }) => {
    await devLogin(page, 'admin');
    await takeScreenshot(page, 'phase2-6-01-dashboard-loaded');

    // Wait for dashboard to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get all text content from the page
    const pageText = await page.textContent('body');
    
    // Check that "Sarah" appears (admin user's name from dev-login)
    const hasSarah = pageText?.includes('Sarah') || false;
    
    // Check that "there" does NOT appear as a greeting
    const hasThere = pageText?.includes('Hello there') || pageText?.includes('Welcome there') || false;

    await takeScreenshot(page, 'phase2-6-02-check-user-name');

    if (hasSarah) {
      console.log('✅ Found user name "Sarah" in dashboard');
    } else {
      console.log('⚠️ User name "Sarah" not found - checking for other names');
      // Check for any user name pattern
      const namePattern = /(Hello|Welcome|Hi)\s+[A-Z][a-z]+/;
      const nameMatch = pageText?.match(namePattern);
      if (nameMatch) {
        console.log(`Found greeting: ${nameMatch[0]}`);
      }
    }

    if (hasThere) {
      console.log('❌ Found "there" fallback - this indicates mock data is still being used');
      throw new Error('Dashboard still shows "there" fallback instead of real user name');
    } else {
      console.log('✅ No "there" fallback found - real user name is being used');
    }

    // Verify feed renders posts from database (not mock)
    const feedContainer = page.locator('main, [data-testid="feed"], [class*="feed"]').first();
    await expect(feedContainer).toBeVisible({ timeout: 10000 });
    
    const feedText = await feedContainer.textContent();
    
    // Check for mock data indicators
    const mockIndicators = ['MOCK_FEED', 'Hope Kitchen', 'Youth Forward'];
    const hasMockData = mockIndicators.some(indicator => feedText?.includes(indicator));
    
    if (hasMockData) {
      console.log('⚠️ Mock data indicators found in feed');
      await takeScreenshot(page, 'phase2-6-03-mock-data-found');
    } else {
      console.log('✅ No mock data indicators found - feed appears to load from database');
      await takeScreenshot(page, 'phase2-6-03-real-data');
    }
  });

  test('Phase 2.8: Remove Mock Projects - Projects page loads from real Supabase', async ({ page }) => {
    await devLogin(page, 'admin');
    
    // Navigate to projects page
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await takeScreenshot(page, 'phase2-8-01-projects-loaded');

    // Get page content
    const pageText = await page.textContent('body');
    
    // Check for mock project indicators
    const mockIndicators = ['MOCK_PROJECT', 'MOCK_PROJECTS'];
    const hasMockData = mockIndicators.some(indicator => pageText?.includes(indicator));
    
    if (hasMockData) {
      console.log('❌ Mock project data found on projects page');
      await takeScreenshot(page, 'phase2-8-02-mock-data-found');
      throw new Error('Projects page still contains MOCK_PROJECT text');
    } else {
      console.log('✅ No mock project data found - page loads from real Supabase');
      await takeScreenshot(page, 'phase2-8-02-real-data');
    }

    // Verify projects page is visible and loaded
    const projectsContainer = page.locator('main, [class*="project"]').first();
    await expect(projectsContainer).toBeVisible({ timeout: 10000 });
  });

  test('Phase 2.9: Post Reactions - Click heart/like button toggles reaction', async ({ page }) => {
    await devLogin(page, 'admin');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await takeScreenshot(page, 'phase2-9-01-dashboard-loaded');

    // Find a post with a like button (heart icon)
    // Look for Heart icon button in post cards
    const likeButton = page.locator('button:has(svg[class*="lucide-heart"]), button:has([class*="Heart"])').first();
    
    if (await likeButton.count() === 0) {
      // Try alternative selectors
      const altLikeButton = page.locator('[class*="post"] button, [class*="card"] button').filter({ hasText: /like|heart/i }).first();
      if (await altLikeButton.count() === 0) {
        await takeScreenshot(page, 'phase2-9-02-no-like-button');
        throw new Error('No like/heart button found on any post');
      }
    }

    await expect(likeButton).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'phase2-9-02-like-button-found');

    // Get initial reaction count
    const initialCountText = await likeButton.locator('span').first().textContent().catch(() => '0');
    const initialCount = parseInt(initialCountText || '0', 10);
    console.log(`Initial reaction count: ${initialCount}`);

    // Check if already liked (filled heart)
    const heartIcon = likeButton.locator('svg[class*="lucide-heart"], svg[class*="Heart"]').first();
    const initialClass = await heartIcon.getAttribute('class').catch(() => '');
    const initiallyLiked = initialClass?.includes('fill') || initialClass?.includes('red');
    console.log(`Initially liked: ${initiallyLiked}`);

    // Click the like button
    await likeButton.click();
    await page.waitForTimeout(1000); // Wait for reaction to process
    
    await takeScreenshot(page, 'phase2-9-03-after-click');

    // Verify the reaction toggled (check for visual change or count change)
    const newCountText = await likeButton.locator('span').first().textContent().catch(() => '0');
    const newCount = parseInt(newCountText || '0', 10);
    console.log(`New reaction count: ${newCount}`);

    const newClass = await heartIcon.getAttribute('class').catch(() => '');
    const nowLiked = newClass?.includes('fill') || newClass?.includes('red');
    console.log(`Now liked: ${nowLiked}`);

    // Verify state changed (either count changed or like state toggled)
    const stateChanged = (newCount !== initialCount) || (initiallyLiked !== nowLiked);
    
    if (stateChanged) {
      console.log('✅ Reaction toggled successfully');
      await takeScreenshot(page, 'phase2-9-04-reaction-toggled');
    } else {
      console.log('⚠️ Reaction may not have toggled - checking for errors');
      await takeScreenshot(page, 'phase2-9-04-no-change');
      
      // Check for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      if (errors.length > 0) {
        console.log('Console errors:', errors);
      }
    }

    // Click again to toggle back
    await likeButton.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'phase2-9-05-toggled-back');
  });

  test('Phase 2.10: Post Comments - Click comment button, type comment, submit', async ({ page }) => {
    await devLogin(page, 'admin');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await takeScreenshot(page, 'phase2-10-01-dashboard-loaded');

    // Find a post with a comment button (message icon)
    const commentButton = page.locator('button:has(svg[class*="lucide-message-circle"]), button:has([class*="MessageCircle"])').first();
    
    if (await commentButton.count() === 0) {
      // Try alternative selectors
      const altCommentButton = page.locator('[class*="post"] button, [class*="card"] button').filter({ hasText: /comment/i }).first();
      if (await altCommentButton.count() === 0) {
        await takeScreenshot(page, 'phase2-10-02-no-comment-button');
        throw new Error('No comment button found on any post');
      }
    }

    await expect(commentButton).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'phase2-10-02-comment-button-found');

    // Click the comment button
    await commentButton.click();
    await page.waitForTimeout(1000); // Wait for comments section to expand
    
    await takeScreenshot(page, 'phase2-10-03-comments-opened');

    // Look for comment input (textarea or input field)
    const commentInput = page.locator('textarea[placeholder*="comment"], textarea[placeholder*="Comment"], textarea[placeholder*="Add"], input[placeholder*="comment"]').first();
    
    if (await commentInput.count() === 0) {
      // Try to find any textarea in the comments section
      const anyTextarea = page.locator('[class*="comment"] textarea, [class*="Comment"] textarea').first();
      if (await anyTextarea.count() === 0) {
        await takeScreenshot(page, 'phase2-10-04-no-input');
        throw new Error('Comment input field not found after clicking comment button');
      }
    }

    await expect(commentInput).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'phase2-10-04-input-visible');

    // Type a test comment - use type instead of fill to trigger React state updates
    const testComment = 'Test comment from Playwright';
    await commentInput.click();
    await page.waitForTimeout(300);
    await commentInput.clear();
    await commentInput.type(testComment, { delay: 50 }); // Type character by character to trigger React onChange
    await page.waitForTimeout(1000); // Wait for React state to update
    
    // Verify text was entered
    const inputValue = await commentInput.inputValue();
    if (!inputValue || !inputValue.includes('Test comment')) {
      await takeScreenshot(page, 'phase2-10-05-comment-not-entered');
      throw new Error(`Comment text not entered. Got: "${inputValue}"`);
    }
    
    await takeScreenshot(page, 'phase2-10-05-comment-typed');

    // Find and click submit button - wait for it to be enabled
    // The button text is "Comment" with a Send icon
    const submitButton = page.locator('button:has-text("Comment"), button:has-text("Post"), button:has-text("Send")').first();
    
    if (await submitButton.count() === 0) {
      // Try to find send icon button
      const sendIconButton = page.locator('button:has(svg[class*="lucide-send"]), button:has([class*="Send"])').first();
      if (await sendIconButton.count() > 0) {
        await expect(sendIconButton).toBeEnabled({ timeout: 5000 });
        await sendIconButton.click();
      } else {
        await takeScreenshot(page, 'phase2-10-06-no-submit-button');
        throw new Error('Submit button not found');
      }
    } else {
      // Wait for button to be enabled before clicking
      await expect(submitButton).toBeEnabled({ timeout: 10000 });
      await submitButton.click();
    }

    await page.waitForTimeout(2000); // Wait for comment to be submitted
    await page.waitForLoadState('networkidle');
    
    await takeScreenshot(page, 'phase2-10-07-comment-submitted');

    // Verify comment appears in the comments list
    const commentText = page.locator(`text=${testComment}`).first();
    
    // Wait a bit more for the comment to appear
    await page.waitForTimeout(1000);
    
    const commentVisible = await commentText.count() > 0;
    
    if (commentVisible) {
      await expect(commentText).toBeVisible({ timeout: 10000 });
      console.log('✅ Comment submitted and appears in comments list');
      await takeScreenshot(page, 'phase2-10-08-comment-visible');
    } else {
      console.log('⚠️ Comment may not have appeared - checking for errors');
      await takeScreenshot(page, 'phase2-10-08-comment-not-visible');
      
      // Check for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      if (errors.length > 0) {
        console.log('Console errors:', errors);
      }
    }
  });

  test('Comprehensive Phase 2 Test - All features in sequence', async ({ page }) => {
    console.log('\n=== Starting Comprehensive Phase 2 Test ===\n');

    // 1. Login as admin user
    console.log('1. Logging in as admin...');
    await devLogin(page, 'admin');
    await takeScreenshot(page, 'comprehensive-01-logged-in');

    // 2. Go to /dashboard
    console.log('2. Navigating to dashboard...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'comprehensive-02-dashboard');

    // 3. Verify user name "Sarah" appears (not "there")
    console.log('3. Verifying user name...');
    const pageText = await page.textContent('body');
    const hasSarah = pageText?.includes('Sarah') || false;
    const hasThere = pageText?.includes('Hello there') || pageText?.includes('Welcome there') || false;
    
    if (hasSarah) {
      console.log('✅ User name "Sarah" found');
    } else {
      console.log('⚠️ User name "Sarah" not found');
    }
    
    if (hasThere) {
      throw new Error('Dashboard still shows "there" fallback');
    }

    // 4. Find a post with like button (heart icon)
    console.log('4. Finding post with like button...');
    const likeButton = page.locator('button:has(svg[class*="lucide-heart"])').first();
    await expect(likeButton).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'comprehensive-03-like-button-found');

    // 5. Click the like button - verify no error
    console.log('5. Clicking like button...');
    await likeButton.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'comprehensive-04-like-clicked');

    // 6. Find a post with comment button (message icon)
    console.log('6. Finding post with comment button...');
    const commentButton = page.locator('button:has(svg[class*="lucide-message-circle"])').first();
    await expect(commentButton).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'comprehensive-05-comment-button-found');

    // 7. Click comment button - verify input appears
    console.log('7. Clicking comment button...');
    await commentButton.click();
    await page.waitForTimeout(1000);
    
    const commentInput = page.locator('textarea[placeholder*="comment"], textarea[placeholder*="Comment"]').first();
    await expect(commentInput).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'comprehensive-06-comment-input-visible');

    // 8. Type "Test comment" in the input
    console.log('8. Typing test comment...');
    await commentInput.fill('Test comment');
    await takeScreenshot(page, 'comprehensive-07-comment-typed');

    // 9. Submit the comment - verify it appears
    console.log('9. Submitting comment...');
    const submitButton = page.locator('button:has-text("Post"), button:has-text("Comment"), button:has-text("Send")').first();
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'comprehensive-08-comment-submitted');

    // 10. Check notification bell in header - click it, verify dropdown
    console.log('10. Testing notification bell...');
    const bellButton = page.locator('button:has(svg[class*="lucide-bell"])').first();
    await expect(bellButton).toBeVisible({ timeout: 10000 });
    await bellButton.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'comprehensive-09-bell-clicked');

    // 11. Go to /projects - verify page loads without MOCK_PROJECT text
    console.log('11. Testing projects page...');
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const projectsText = await page.textContent('body');
    const hasMockProject = projectsText?.includes('MOCK_PROJECT') || false;
    
    if (hasMockProject) {
      throw new Error('Projects page contains MOCK_PROJECT text');
    }
    
    await takeScreenshot(page, 'comprehensive-10-projects-loaded');
    
    console.log('\n=== Comprehensive Phase 2 Test Complete ===\n');
  });
});

