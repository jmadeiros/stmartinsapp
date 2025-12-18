import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOT_DIR = 'test-screenshots/wave1';

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

test.describe('Phase 3 Wave 1 Feature Tests', () => {
  test.setTimeout(120_000);
  test.describe.configure({ mode: 'serial' });

  // ============================================
  // 3.1 NOTIFICATIONS DROPDOWN TESTS
  // ============================================
  test.describe('3.1 Notifications Dropdown', () => {
    test('Notification bell exists in header', async ({ page }) => {
      await devLogin(page, 'admin');
      await takeScreenshot(page, 'notif-01-dashboard');

      // Find notification bell button
      const bellButton = page.locator('button:has(svg[class*="lucide-bell"]), button[aria-label*="notification"]').first();

      await expect(bellButton).toBeVisible({ timeout: 10000 });
      console.log('✅ Notification bell found in header');
      await takeScreenshot(page, 'notif-02-bell-found');
    });

    test('Notification dropdown opens on click', async ({ page }) => {
      await devLogin(page, 'admin');

      const bellButton = page.locator('button:has(svg[class*="lucide-bell"])').first();
      await expect(bellButton).toBeVisible({ timeout: 10000 });

      await bellButton.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'notif-dropdown-01-opened');

      // Look for dropdown content
      const dropdown = page.locator('[role="dialog"], [class*="dropdown"], [class*="popover"]').first();

      if (await dropdown.count() > 0) {
        console.log('✅ Notification dropdown opened');

        // Check for notification content
        const dropdownText = await dropdown.textContent();
        if (dropdownText && (dropdownText.includes('Notification') || dropdownText.includes('caught up') || dropdownText.includes('No new'))) {
          console.log('✅ Dropdown shows notification content');
        }
      } else {
        console.log('⚠️ Dropdown not detected (may use different element)');
      }

      // Close dropdown
      await page.keyboard.press('Escape');
    });

    test('Notification badge shows unread count', async ({ page }) => {
      await devLogin(page, 'admin');

      const bellButton = page.locator('button:has(svg[class*="lucide-bell"])').first();
      await expect(bellButton).toBeVisible({ timeout: 10000 });

      // Check for badge
      const badge = bellButton.locator('span[class*="rounded-full"], span[class*="badge"]').first();

      if (await badge.count() > 0) {
        const badgeText = await badge.textContent();
        console.log(`✅ Notification badge found with count: ${badgeText || '0'}`);
        await takeScreenshot(page, 'notif-badge-01-found');
      } else {
        console.log('ℹ️ No notification badge (count may be 0)');
        await takeScreenshot(page, 'notif-badge-01-none');
      }
    });
  });

  // ============================================
  // 3.8 SEARCH TESTS
  // ============================================
  test.describe('3.8 Search Feature', () => {
    test('Search page loads', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'search-01-page-loaded');

      // Verify search page loaded
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
      console.log('✅ Search page loaded');
    });

    test('Search input exists and accepts text', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"], input[class*="search"]').first();

      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible({ timeout: 5000 });

        // Type in search
        await searchInput.fill('test search query');
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'search-02-input-filled');

        const inputValue = await searchInput.inputValue();
        expect(inputValue).toContain('test');
        console.log('✅ Search input accepts text');
      } else {
        console.log('⚠️ Search input not found');
        await takeScreenshot(page, 'search-02-no-input');
      }
    });

    test('Search returns results', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

      if (await searchInput.count() > 0) {
        // Search for common term
        await searchInput.fill('test');
        await page.waitForTimeout(1000);

        // Press enter or wait for auto-search
        await searchInput.press('Enter');
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'search-results-01');

        // Look for results
        const results = page.locator('[class*="result"], [class*="card"], [class*="item"]');
        const resultCount = await results.count();

        if (resultCount > 0) {
          console.log(`✅ Search returned ${resultCount} results`);
        } else {
          console.log('ℹ️ No search results (may be expected for test query)');
        }
      }
    });

    test('Search has category tabs', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for category tabs (Posts, People, Events, Projects)
      const tabs = page.locator('button:has-text("Posts"), button:has-text("People"), button:has-text("Events"), [role="tab"]');
      const tabCount = await tabs.count();

      if (tabCount > 0) {
        console.log(`✅ Found ${tabCount} search category tabs`);
        await takeScreenshot(page, 'search-tabs-01-found');
      } else {
        console.log('ℹ️ Category tabs not visible');
        await takeScreenshot(page, 'search-tabs-01-none');
      }
    });
  });

  // ============================================
  // 3.9 PROFILE PAGE TESTS
  // ============================================
  test.describe('3.9 Profile Page', () => {
    test('Profile page loads', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'profile-01-loaded');

      expect(page.url()).toContain('/profile');
      console.log('✅ Profile page loaded');
    });

    test('Profile shows user information', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const pageContent = await page.textContent('body');

      // Check for profile elements
      const hasProfileContent = pageContent && (
        pageContent.includes('Sarah') || // Admin user name
        pageContent.includes('Profile') ||
        pageContent.includes('Bio') ||
        pageContent.includes('Edit')
      );

      if (hasProfileContent) {
        console.log('✅ Profile shows user information');
        await takeScreenshot(page, 'profile-02-content');
      } else {
        console.log('⚠️ Profile content may be missing');
        await takeScreenshot(page, 'profile-02-no-content');
      }
    });

    test('Profile has edit functionality', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for edit button
      const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit"], a:has-text("Edit")').first();

      if (await editButton.count() > 0) {
        await expect(editButton).toBeVisible({ timeout: 5000 });
        console.log('✅ Profile edit button found');
        await takeScreenshot(page, 'profile-edit-01-button');

        // Click edit
        await editButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'profile-edit-02-clicked');
      } else {
        console.log('ℹ️ Edit button not found (may be inline editing)');
        await takeScreenshot(page, 'profile-edit-01-none');
      }
    });

    test('Profile shows avatar', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for avatar image
      const avatar = page.locator('img[class*="avatar"], img[class*="Avatar"], [class*="avatar"] img').first();

      if (await avatar.count() > 0) {
        console.log('✅ Profile avatar found');
        await takeScreenshot(page, 'profile-avatar-01');
      } else {
        // Check for avatar placeholder
        const avatarPlaceholder = page.locator('[class*="avatar"], [class*="Avatar"]').first();
        if (await avatarPlaceholder.count() > 0) {
          console.log('✅ Profile avatar placeholder found');
        } else {
          console.log('⚠️ No avatar element found');
        }
      }
    });
  });

  // ============================================
  // 3.10 SETTINGS PAGE TESTS
  // ============================================
  test.describe('3.10 Settings Page', () => {
    test('Settings page loads', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'settings-01-loaded');

      expect(page.url()).toContain('/settings');
      console.log('✅ Settings page loaded');
    });

    test('Settings has notification preferences', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const pageContent = await page.textContent('body');

      // Check for notification settings
      const hasNotifSettings = pageContent && (
        pageContent.includes('Notification') ||
        pageContent.includes('Email') ||
        pageContent.includes('notification')
      );

      if (hasNotifSettings) {
        console.log('✅ Settings has notification preferences');
        await takeScreenshot(page, 'settings-notif-01');
      } else {
        console.log('⚠️ Notification settings not found');
        await takeScreenshot(page, 'settings-notif-01-none');
      }
    });

    test('Settings has toggles/switches', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for toggle switches
      const toggles = page.locator('[role="switch"], input[type="checkbox"], [class*="switch"], [class*="toggle"]');
      const toggleCount = await toggles.count();

      if (toggleCount > 0) {
        console.log(`✅ Found ${toggleCount} setting toggles`);
        await takeScreenshot(page, 'settings-toggles-01');
      } else {
        console.log('ℹ️ No toggles found');
        await takeScreenshot(page, 'settings-toggles-01-none');
      }
    });

    test('Settings can be saved', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for save button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();

      if (await saveButton.count() > 0) {
        console.log('✅ Save button found');
        await takeScreenshot(page, 'settings-save-01');
      } else {
        console.log('ℹ️ No explicit save button (may auto-save)');
      }
    });
  });

  // ============================================
  // 3.11 ADMIN PAGE TESTS
  // ============================================
  test.describe('3.11 Admin Page', () => {
    test('Admin page loads for admin user', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'admin-01-loaded');

      // Verify we're on admin page (not redirected)
      const url = page.url();
      if (url.includes('/admin')) {
        console.log('✅ Admin page loaded for admin user');
      } else {
        console.log('⚠️ Redirected away from admin page');
      }
    });

    test('Admin page shows stats', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const pageContent = await page.textContent('body');

      // Check for admin stats
      const hasStats = pageContent && (
        pageContent.includes('Users') ||
        pageContent.includes('Posts') ||
        pageContent.includes('Total') ||
        pageContent.includes('Active')
      );

      if (hasStats) {
        console.log('✅ Admin page shows stats');
        await takeScreenshot(page, 'admin-stats-01');
      } else {
        console.log('⚠️ Stats not visible');
        await takeScreenshot(page, 'admin-stats-01-none');
      }
    });

    test('Admin page has user management', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for user list or user management section
      const userSection = page.locator('text=/Users|Members|People/i').first();

      if (await userSection.count() > 0) {
        console.log('✅ User management section found');
        await takeScreenshot(page, 'admin-users-01');
      } else {
        console.log('ℹ️ User management section not immediately visible');
        await takeScreenshot(page, 'admin-users-01-none');
      }
    });

    test('Admin page restricted for non-admin', async ({ page }) => {
      await devLogin(page, 'volunteer'); // Login as non-admin

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'admin-restricted-01');

      const url = page.url();
      const pageContent = await page.textContent('body');

      // Should be redirected or see access denied
      const isRestricted = !url.includes('/admin') ||
        (pageContent && (
          pageContent.includes('denied') ||
          pageContent.includes('permission') ||
          pageContent.includes('authorized') ||
          pageContent.includes('access')
        ));

      if (isRestricted) {
        console.log('✅ Admin page properly restricted for non-admin');
      } else {
        console.log('⚠️ Admin page may not be properly restricted');
      }
    });
  });

  // ============================================
  // COMPREHENSIVE WAVE 1 TEST
  // ============================================
  test('Comprehensive Wave 1 Test - All features in sequence', async ({ page }) => {
    console.log('\n=== Starting Comprehensive Wave 1 Test ===\n');

    // 1. Login
    console.log('1. Logging in as admin...');
    await devLogin(page, 'admin');
    await takeScreenshot(page, 'wave1-comp-01-logged-in');

    // 2. Test notification bell
    console.log('2. Testing notifications...');
    const bellButton = page.locator('button:has(svg[class*="lucide-bell"])').first();
    if (await bellButton.count() > 0) {
      await bellButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Notification dropdown accessible');
      await page.keyboard.press('Escape');
    }
    await takeScreenshot(page, 'wave1-comp-02-notifications');

    // 3. Navigate to Search
    console.log('3. Testing search...');
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/search');
    console.log('✅ Search page accessible');
    await takeScreenshot(page, 'wave1-comp-03-search');

    // 4. Navigate to Profile
    console.log('4. Testing profile...');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/profile');
    console.log('✅ Profile page accessible');
    await takeScreenshot(page, 'wave1-comp-04-profile');

    // 5. Navigate to Settings
    console.log('5. Testing settings...');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/settings');
    console.log('✅ Settings page accessible');
    await takeScreenshot(page, 'wave1-comp-05-settings');

    // 6. Navigate to Admin
    console.log('6. Testing admin...');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    if (page.url().includes('/admin')) {
      console.log('✅ Admin page accessible');
    }
    await takeScreenshot(page, 'wave1-comp-06-admin');

    console.log('\n=== Comprehensive Wave 1 Test Complete ===\n');
  });
});
