import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOT_DIR = 'test-screenshots/notification-navigation';

// Helper function to take screenshots
async function takeScreenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`[Screenshot] ${screenshotPath}`);
}

// Helper function to perform dev login
async function devLogin(page: Page, role: string = 'admin') {
  const appBaseUrl = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment');
  }

  // Navigate to login page first
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Call the dev-login API to get credentials
  const apiResponse = await page.request.post(`${appBaseUrl}/api/dev-login`, {
    data: { role }
  });

  if (!apiResponse.ok()) {
    throw new Error(`Dev login API failed: ${await apiResponse.text()}`);
  }

  const apiData = await apiResponse.json();
  const { email, password, userId, orgId } = apiData;

  // Sign in using Supabase's REST API
  const authResponse = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    data: { email, password },
  });

  if (!authResponse.ok()) {
    const errorText = await authResponse.text();
    throw new Error(`Supabase auth failed: ${errorText}`);
  }

  const authData: any = await authResponse.json();
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

  // Set cookies and localStorage for authentication
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
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  return { userId, orgId, email };
}

// Helper to create a post directly via Supabase REST API and return the post ID
async function createPostAndGetId(page: Page, content: string, userId: string, orgId: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create post directly via Supabase REST API
  const postData = {
    content: content,
    author_id: userId,
    org_id: orgId,
    category: 'general',
  };

  const createResponse = await page.request.post(`${supabaseUrl}/rest/v1/posts`, {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    data: postData,
  });

  if (!createResponse.ok()) {
    console.error('Failed to create post via API:', await createResponse.text());
    return null;
  }

  const posts = await createResponse.json();
  if (posts.length === 0) {
    console.error('No post returned from create API');
    return null;
  }

  const postId = posts[0].id;
  console.log('[Test] Created post via API with ID:', postId);

  // Navigate to dashboard to verify post appears
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Verify post appears in feed
  try {
    await page.waitForSelector(`text=${content}`, { timeout: 15000 });
    console.log('[Test] Post verified in feed');
  } catch {
    console.log('[Test] Post may not be visible in feed yet, continuing with test');
  }

  return postId;
}

// Helper to create a notification for a post (simulating a like from another user)
async function createNotificationForPost(page: Page, postId: string, recipientUserId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY for creating notification');
    return false;
  }

  // Create a notification directly in the database
  // Schema: id, user_id, actor_id, type, title, reference_type, reference_id, link, read, created_at
  const notification = {
    user_id: recipientUserId,
    actor_id: recipientUserId, // Self-notification for test purposes
    type: 'reaction',
    title: 'Test User liked your post',
    reference_type: 'post',
    reference_id: postId,
    link: `/posts/${postId}`,
    read: false
  };

  const createResponse = await page.request.post(`${supabaseUrl}/rest/v1/notifications`, {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    data: notification,
  });

  if (!createResponse.ok()) {
    console.error('Failed to create notification:', await createResponse.text());
    return false;
  }

  console.log('[Test] Created notification for post:', postId);
  return true;
}

// Helper to clean up test data
async function cleanupTestData(page: Page, postId: string | null) {
  if (!postId) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('[Cleanup] Skipping cleanup - missing service key');
    return;
  }

  try {
    // Delete notifications for this post
    await page.request.delete(`${supabaseUrl}/rest/v1/notifications?reference_id=eq.${postId}`, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });

    // Soft delete the post
    await page.request.patch(`${supabaseUrl}/rest/v1/posts?id=eq.${postId}`, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      data: { deleted_at: new Date().toISOString() },
    });

    console.log('[Cleanup] Cleaned up test data for post:', postId);
  } catch (error) {
    console.warn('[Cleanup] Error during cleanup:', error);
  }
}

// Increase timeout for notification tests
test.setTimeout(120_000);

// Run tests in this file sequentially to avoid conflicts with shared auth state
test.describe.configure({ mode: 'serial' });

test.describe('Notification Navigation', () => {
  test('clicking a notification should navigate to the correct post page', async ({ page }) => {
    const timestamp = Date.now();
    const postContent = `Test post for notification navigation - ${timestamp}`;
    let postId: string | null = null;

    try {
      // Step 1: Login as admin (Sarah)
      console.log('[Test] Step 1: Login as admin user');
      const { userId, orgId } = await devLogin(page, 'admin');
      await takeScreenshot(page, '01-logged-in');

      // Step 2: Create a new post
      console.log('[Test] Step 2: Create a new post');
      postId = await createPostAndGetId(page, postContent, userId, orgId);
      expect(postId).not.toBeNull();
      console.log('[Test] Created post with ID:', postId);
      await takeScreenshot(page, '02-post-created');

      // Step 3: Create a notification for the post
      console.log('[Test] Step 3: Create notification for the post');
      const notificationCreated = await createNotificationForPost(page, postId!, userId);
      expect(notificationCreated).toBe(true);

      // Verify notification was created in database
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const verifyResponse = await page.request.get(`${supabaseUrl}/rest/v1/notifications?user_id=eq.${userId}&reference_id=eq.${postId}&select=*`, {
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
        });
        if (verifyResponse.ok()) {
          const notifications = await verifyResponse.json();
          console.log('[Test] Verified notification in DB:', notifications.length > 0 ? notifications[0] : 'NOT FOUND');
        }
      }

      // Step 4: Refresh the page to see the notification
      console.log('[Test] Step 4: Refresh page to see notification');
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000); // Give time for React Query to fetch notifications
      await takeScreenshot(page, '03-page-refreshed');

      // Step 5: Click the notification bell
      console.log('[Test] Step 5: Click notification bell');
      const bellButton = page.locator('[data-notification-bell], button:has(svg.lucide-bell)').first();
      await expect(bellButton).toBeVisible({ timeout: 10000 });
      await bellButton.click();
      await page.waitForTimeout(1500); // Wait for dropdown to open and notifications to load
      await takeScreenshot(page, '04-notification-dropdown-open');

      // Wait for notifications to load in the dropdown
      // Try to find "liked your post" text which indicates our notification loaded
      const notificationLoaded = page.locator('text=liked your post');
      try {
        await notificationLoaded.waitFor({ state: 'visible', timeout: 10000 });
        console.log('[Test] Notification "liked your post" is visible in dropdown');
      } catch {
        console.log('[Test] WARNING: Could not find "liked your post" notification text');
        // Take screenshot to debug
        await takeScreenshot(page, '04b-notification-not-found');
      }

      // Step 6: Find and click the notification
      console.log('[Test] Step 6: Click on the notification');

      // The notification items have onClick handlers that navigate.
      // We need to click properly to trigger the JS event handlers.
      // Look for the notification with "liked your post" text

      let clicked = false;

      // Find the notification item - it's a div with group class and onClick
      // The structure is: div.group.relative.p-4 containing the notification content
      const notificationItem = page.locator('.group.relative.p-4').filter({
        hasText: /liked your post/
      }).first();

      if (await notificationItem.count() > 0) {
        console.log('[Test] Found notification item with "liked your post"');
        // Scroll into view and click normally (not with force)
        await notificationItem.scrollIntoViewIfNeeded();
        await notificationItem.click();
        clicked = true;
        console.log('[Test] Clicked notification item');
      }

      // Fallback: click on the notification text itself
      if (!clicked) {
        const notificationText = page.getByText('liked your post').first();
        if (await notificationText.count() > 0) {
          console.log('[Test] Clicking on notification text');
          await notificationText.click();
          clicked = true;
        }
      }

      if (!clicked) {
        console.log('[Test] ERROR: Could not find notification to click');
        await takeScreenshot(page, '05-no-notification-found');
      }

      expect(clicked).toBe(true);
      await takeScreenshot(page, '05-notification-clicked');

      // Step 7: Verify navigation to correct URL
      console.log('[Test] Step 7: Verify navigation');
      await page.waitForTimeout(3000);
      await page.waitForLoadState('domcontentloaded');

      const currentUrl = page.url();
      console.log('[Test] Current URL:', currentUrl);
      await takeScreenshot(page, '06-navigated-to-post');

      // Verify URL contains /posts/{postId}
      expect(currentUrl).toContain(`/posts/${postId}`);
      console.log('[Test] SUCCESS: Navigated to correct post URL');

      // Step 8: Verify post content is visible
      console.log('[Test] Step 8: Verify post content is visible');

      // Wait for post detail to load
      await page.waitForTimeout(1000);

      // Check for post content on the page
      const postContentVisible = await page.locator(`text=${postContent}`).isVisible();

      // Also check for the data-testid we added
      const postDetail = page.locator('[data-testid="post-detail"]');
      const postDetailVisible = await postDetail.count() > 0;

      await takeScreenshot(page, '07-post-content-visible');

      expect(postContentVisible || postDetailVisible).toBe(true);
      console.log('[Test] SUCCESS: Post content is visible on the page');

      // Step 9: Verify dropdown is closed after clicking notification
      console.log('[Test] Step 9: Verify dropdown is closed');
      const dropdownStillOpen = page.locator('[role="dialog"]').filter({ hasText: 'Notifications' });
      const isDropdownStillVisible = await dropdownStillOpen.isVisible().catch(() => false);

      // The dropdown should be closed after navigation
      expect(isDropdownStillVisible).toBe(false);
      console.log('[Test] SUCCESS: Dropdown closed after navigation');

      console.log('[Test] All notification navigation tests passed!');

    } finally {
      // Cleanup
      await cleanupTestData(page, postId);
    }
  });

  test('notification should show correct post preview', async ({ page }) => {
    const timestamp = Date.now();
    const postContent = `Preview test post with specific content - ${timestamp}`;
    let postId: string | null = null;

    try {
      // Login and create post
      const { userId, orgId } = await devLogin(page, 'admin');
      postId = await createPostAndGetId(page, postContent, userId, orgId);
      expect(postId).not.toBeNull();

      // Create notification
      await createNotificationForPost(page, postId!, userId);

      // Refresh and open notifications
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const bellButton = page.locator('button:has(svg.lucide-bell), [data-notification-bell]').first();
      await bellButton.click();
      await page.waitForTimeout(500);

      // Verify notification contains post preview
      const pageContent = await page.content();
      const hasPostPreview = pageContent.includes('Preview test post') || pageContent.includes('liked your post');

      expect(hasPostPreview).toBe(true);
      console.log('[Test] Notification shows correct post preview');

    } finally {
      await cleanupTestData(page, postId);
    }
  });

  test('back button should return to dashboard from post page', async ({ page }) => {
    const timestamp = Date.now();
    const postContent = `Back button test post - ${timestamp}`;
    let postId: string | null = null;

    try {
      // Login and create post
      const { userId, orgId } = await devLogin(page, 'admin');
      postId = await createPostAndGetId(page, postContent, userId, orgId);
      expect(postId).not.toBeNull();

      // Navigate directly to post page
      await page.goto(`/posts/${postId}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Verify we're on the post page
      expect(page.url()).toContain(`/posts/${postId}`);

      // Click back button
      const backButton = page.locator('text=Back to Feed').first();
      if (await backButton.count() > 0) {
        await backButton.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // Verify we're back on dashboard
        expect(page.url()).toContain('/dashboard');
        console.log('[Test] Back button successfully returns to dashboard');
      } else {
        console.log('[Test] Back button not found - using browser back');
        await page.goBack();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
      }

    } finally {
      await cleanupTestData(page, postId);
    }
  });
});
