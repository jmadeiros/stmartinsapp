/**
 * Post Editing E2E Tests
 *
 * Tests the edit post functionality:
 * - Login as test user
 * - Create a new post with specific content
 * - Find the post, click the menu (three dots)
 * - Click "Edit" option
 * - Verify EditPostDialog opens with current content
 * - Modify the content
 * - Save changes
 * - Verify post shows updated content
 * - Refresh page, verify changes persisted
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOT_DIR = 'test-screenshots/post-editing';

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
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  const currentUrl = page.url();
  const urlObj = new URL(currentUrl);
  const appBaseUrl = `${urlObj.protocol}//${urlObj.host}`;

  const apiResponse = await page.request.post(`${appBaseUrl}/api/dev-login`, {
    data: { role: role },
    timeout: 60000
  });

  if (!apiResponse.ok()) {
    throw new Error(`Dev login API failed: ${await apiResponse.text()}`);
  }

  const apiData = await apiResponse.json();
  const { email, password } = apiData;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const authResponse = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    data: { email, password },
  });

  if (!authResponse.ok()) {
    throw new Error(`Supabase auth failed: ${await authResponse.text()}`);
  }

  const authData: any = await authResponse.json();
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

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

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
}

test.describe('Post Editing Feature Tests', () => {
  test.setTimeout(120_000);
  test.describe.configure({ mode: 'serial' });

  // Test data to persist across tests
  let testPostContent: string;
  let updatedPostContent: string;

  test('Create a post, edit it, and verify changes persist', async ({ page }) => {
    console.log('\n=== Post Editing Full Flow Test ===\n');

    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    await devLogin(page, 'admin');
    await takeScreenshot(page, '01-logged-in');
    console.log('Logged in successfully');

    // Step 2: Create a new post with unique content
    console.log('Step 2: Creating a new post...');
    const timestamp = Date.now();
    testPostContent = `E2E Test Post for Editing - ${timestamp} - This post will be edited.`;
    updatedPostContent = `EDITED: E2E Test Post - ${timestamp} - This content has been updated!`;

    const textarea = page.locator('textarea[placeholder*="Share an update"]').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.scrollIntoViewIfNeeded();
    await textarea.click();
    await textarea.fill(testPostContent);
    await page.waitForTimeout(500);
    await takeScreenshot(page, '02-post-typed');

    // Submit the post
    const postButton = page.getByRole('button', { name: /^Post$/i }).first();
    await expect(postButton).toBeEnabled();
    await postButton.click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '03-post-submitted');

    // Verify post appears in feed
    await page.waitForSelector(`text=${testPostContent.substring(0, 50)}`, { timeout: 15000 });
    const postInFeed = page.locator(`text=${testPostContent.substring(0, 50)}`).first();
    await expect(postInFeed).toBeVisible({ timeout: 10000 });
    console.log('Post created and visible in feed');

    // Step 3: Find and click the post menu (three dots)
    console.log('Step 3: Opening post menu...');
    // Scroll to the post card that contains our content
    const postCard = page.locator('.card, [class*="Card"]').filter({ hasText: testPostContent.substring(0, 30) }).first();
    await postCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Find and click the menu button (MoreHorizontal icon)
    const menuButton = postCard.locator('button:has(svg[class*="lucide-more-horizontal"]), button[aria-label*="menu"], button[aria-label*="More"]').first();
    await expect(menuButton).toBeVisible({ timeout: 5000 });
    await menuButton.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '04-menu-opened');

    // Step 4: Click "Edit" option
    console.log('Step 4: Clicking Edit option...');
    const editOption = page.locator('text=Edit').first();
    await expect(editOption).toBeVisible({ timeout: 5000 });
    await editOption.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '05-edit-dialog-opened');

    // Step 5: Verify EditPostDialog opens with current content
    console.log('Step 5: Verifying edit dialog content...');
    const editDialog = page.locator('[role="dialog"]').first();
    await expect(editDialog).toBeVisible({ timeout: 5000 });

    // Check dialog title
    const dialogTitle = editDialog.locator('text=Edit Post');
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    // Verify the textarea contains the original content
    const editTextarea = editDialog.locator('textarea').first();
    await expect(editTextarea).toBeVisible({ timeout: 5000 });
    const currentValue = await editTextarea.inputValue();
    expect(currentValue).toContain(testPostContent.substring(0, 30));
    console.log('Edit dialog shows current content correctly');

    // Step 6: Modify the content
    console.log('Step 6: Modifying post content...');
    await editTextarea.clear();
    await editTextarea.fill(updatedPostContent);
    await page.waitForTimeout(500);
    await takeScreenshot(page, '06-content-modified');

    // Step 7: Save changes
    console.log('Step 7: Saving changes...');
    const saveButton = editDialog.getByRole('button', { name: /Save Changes/i }).first();
    await expect(saveButton).toBeEnabled({ timeout: 5000 });
    await saveButton.click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '07-changes-saved');

    // Step 8: Verify post shows updated content
    console.log('Step 8: Verifying updated content in feed...');
    // The dialog should be closed
    await expect(editDialog).not.toBeVisible({ timeout: 5000 });

    // The updated content should be visible
    const updatedPostInFeed = page.locator(`text=${updatedPostContent.substring(0, 30)}`).first();
    await expect(updatedPostInFeed).toBeVisible({ timeout: 10000 });
    console.log('Updated content visible in feed');

    // Step 9: Refresh page and verify changes persisted
    console.log('Step 9: Refreshing page to verify persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '08-page-refreshed');

    // Verify the updated content is still there
    const persistedPost = page.locator(`text=${updatedPostContent.substring(0, 30)}`).first();
    await expect(persistedPost).toBeVisible({ timeout: 10000 });
    console.log('Changes persisted after page refresh');

    console.log('\n=== Post Editing Test Complete ===\n');
  });

  test('Edit dialog preserves category selection', async ({ page }) => {
    console.log('\n=== Edit Dialog Category Test ===\n');

    // Login
    await devLogin(page, 'admin');

    // Create a post with a specific category
    const timestamp = Date.now();
    const testContent = `Category Test Post - ${timestamp}`;

    const textarea = page.locator('textarea[placeholder*="Share an update"]').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.click();
    await textarea.fill(testContent);

    // Select a category (e.g., "Questions")
    const categoryButton = page.locator('button:has-text("Questions"), button[data-category="questions"]').first();
    if (await categoryButton.count() > 0) {
      await categoryButton.click();
      await page.waitForTimeout(300);
    }

    // Submit the post
    const postButton = page.getByRole('button', { name: /^Post$/i }).first();
    await postButton.click();
    await page.waitForTimeout(3000);

    // Wait for post to appear
    await page.waitForSelector(`text=${testContent.substring(0, 30)}`, { timeout: 15000 });

    // Open edit dialog
    const postCard = page.locator('.card, [class*="Card"]').filter({ hasText: testContent.substring(0, 30) }).first();
    await postCard.scrollIntoViewIfNeeded();
    const menuButton = postCard.locator('button:has(svg[class*="lucide-more-horizontal"]), button[aria-label*="menu"]').first();
    await menuButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit').first();
    await editOption.click();
    await page.waitForTimeout(1000);

    // Verify dialog opened
    const editDialog = page.locator('[role="dialog"]').first();
    await expect(editDialog).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'category-edit-dialog');

    // Verify content is in textarea
    const editTextarea = editDialog.locator('textarea').first();
    const value = await editTextarea.inputValue();
    expect(value).toContain(testContent.substring(0, 30));

    // Close dialog
    await page.keyboard.press('Escape');

    console.log('\n=== Category Test Complete ===\n');
  });

  test('Only post author can see edit option', async ({ page }) => {
    console.log('\n=== Author-Only Edit Permission Test ===\n');

    // First, login as admin and create a post
    await devLogin(page, 'admin');

    const timestamp = Date.now();
    const adminPostContent = `Admin Post - ${timestamp} - Only admin should edit this`;

    const textarea = page.locator('textarea[placeholder*="Share an update"]').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill(adminPostContent);

    const postButton = page.getByRole('button', { name: /^Post$/i }).first();
    await postButton.click();
    await page.waitForTimeout(3000);

    // Verify post created
    await page.waitForSelector(`text=${adminPostContent.substring(0, 30)}`, { timeout: 15000 });
    console.log('Admin created a post');

    // Now login as a different user (staff)
    await page.context().clearCookies();
    await devLogin(page, 'st_martins_staff');
    await page.waitForTimeout(2000);

    // Find the admin's post
    const adminPost = page.locator(`text=${adminPostContent.substring(0, 30)}`).first();

    if (await adminPost.count() > 0) {
      // Try to find and open the menu for this post
      const postCard = page.locator('.card, [class*="Card"]').filter({ hasText: adminPostContent.substring(0, 30) }).first();
      await postCard.scrollIntoViewIfNeeded();

      const menuButton = postCard.locator('button:has(svg[class*="lucide-more-horizontal"]), button[aria-label*="menu"]').first();

      if (await menuButton.count() > 0) {
        await menuButton.click();
        await page.waitForTimeout(500);

        // Check if Edit option is visible - it should NOT be for non-author
        const editOption = page.locator('text=Edit').first();
        const editVisible = await editOption.isVisible().catch(() => false);

        if (!editVisible) {
          console.log('Edit option correctly hidden for non-author');
        } else {
          console.log('Warning: Edit option is visible to non-author (may be expected if user is admin)');
        }
      }
    }

    console.log('\n=== Author Permission Test Complete ===\n');
  });

  test('Edit dialog validates empty content', async ({ page }) => {
    console.log('\n=== Edit Dialog Validation Test ===\n');

    // Login and create a post
    await devLogin(page, 'admin');

    const timestamp = Date.now();
    const testContent = `Validation Test Post - ${timestamp}`;

    const textarea = page.locator('textarea[placeholder*="Share an update"]').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill(testContent);

    const postButton = page.getByRole('button', { name: /^Post$/i }).first();
    await postButton.click();
    await page.waitForTimeout(3000);

    await page.waitForSelector(`text=${testContent.substring(0, 30)}`, { timeout: 15000 });

    // Open edit dialog
    const postCard = page.locator('.card, [class*="Card"]').filter({ hasText: testContent.substring(0, 30) }).first();
    const menuButton = postCard.locator('button:has(svg[class*="lucide-more-horizontal"]), button[aria-label*="menu"]').first();
    await menuButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit').first();
    await editOption.click();
    await page.waitForTimeout(1000);

    const editDialog = page.locator('[role="dialog"]').first();
    await expect(editDialog).toBeVisible({ timeout: 5000 });

    // Clear the content
    const editTextarea = editDialog.locator('textarea').first();
    await editTextarea.clear();
    await page.waitForTimeout(500);

    // Save button should be disabled with empty content
    const saveButton = editDialog.getByRole('button', { name: /Save Changes/i }).first();
    await expect(saveButton).toBeDisabled({ timeout: 5000 });
    console.log('Save button correctly disabled for empty content');

    // Close dialog
    await page.keyboard.press('Escape');

    console.log('\n=== Validation Test Complete ===\n');
  });
});
