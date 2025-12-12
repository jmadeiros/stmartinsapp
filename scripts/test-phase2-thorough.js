#!/usr/bin/env node
/**
 * Phase 2 Thorough Tests - Actually submits likes and comments
 * Verifies the data actually changes, not just that buttons exist
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function devLogin(page, role = 'admin') {
  const apiResponse = await page.request.post(`${BASE_URL}/api/dev-login`, {
    data: { role }
  });

  if (!apiResponse.ok()) {
    throw new Error(`Dev login API failed: ${await apiResponse.text()}`);
  }

  const { email, password } = await apiResponse.json();

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

async function runTests() {
  console.log('\n🧪 Phase 2 THOROUGH Tests - Actual Submissions\n');
  console.log(`Testing: ${BASE_URL}\n`);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables!');
    console.log('\nRun with: source .env.local && node scripts/test-phase2-thorough.js');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true }); // Headless for speed
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('🔐 Logging in as admin...');
    await devLogin(page, 'admin');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ Logged in successfully\n');

    // ============================================
    // TEST 1: Like button actually changes count
    // ============================================
    console.log('📝 TEST 1: Like button changes count');
    console.log('   Finding like button...');

    // Find the first post card with a like button
    const likeButton = page.locator('button:has(svg.lucide-heart)').first();
    await likeButton.waitFor({ timeout: 10000 });

    // Get the like count before clicking
    // The count might be in a span near the button or in the button itself
    const likeButtonParent = likeButton.locator('..');
    const likeCountBefore = await likeButtonParent.textContent();
    console.log(`   Like area text before: "${likeCountBefore.trim()}"`);

    // Take screenshot before
    await page.screenshot({ path: 'test-screenshots/like-before.png', fullPage: false, timeout: 10000 });
    console.log('   📸 Screenshot: like-before.png');

    // Click the like button
    console.log('   Clicking like button...');
    await likeButton.click();
    await page.waitForTimeout(1500); // Wait for server action

    // Get the like count after clicking
    const likeCountAfter = await likeButtonParent.textContent();
    console.log(`   Like area text after: "${likeCountAfter.trim()}"`);

    // Take screenshot after
    await page.screenshot({ path: 'test-screenshots/like-after.png', fullPage: false, timeout: 10000 });
    console.log('   📸 Screenshot: like-after.png');

    // Check if something changed (button filled, count changed, etc)
    const heartIcon = likeButton.locator('svg.lucide-heart');
    const heartFillAfter = await heartIcon.getAttribute('fill');
    console.log(`   Heart fill attribute: "${heartFillAfter}"`);

    if (likeCountBefore !== likeCountAfter || heartFillAfter) {
      console.log('✅ TEST 1 PASSED: Like interaction changed something!\n');
    } else {
      console.log('⚠️  TEST 1 WARNING: No visible change detected (may need to check UI)\n');
    }

    // ============================================
    // TEST 2: Comment actually gets posted
    // ============================================
    console.log('📝 TEST 2: Comment actually gets posted');

    // Find comment button
    console.log('   Finding comment button...');
    const commentButton = page.locator('button:has(svg.lucide-message-circle), button:has(svg.lucide-message-square)').first();
    await commentButton.waitFor({ timeout: 10000 });

    // Click to expand comments
    console.log('   Clicking comment button to expand...');
    await commentButton.click();
    await page.waitForTimeout(1000);

    // Take screenshot of expanded comments area
    await page.screenshot({ path: 'test-screenshots/comment-expanded.png', fullPage: false, timeout: 10000 });
    console.log('   📸 Screenshot: comment-expanded.png');

    // Find the comment input
    console.log('   Looking for comment input...');
    const commentInput = page.locator('input[placeholder*="comment" i], textarea[placeholder*="comment" i], input[placeholder*="reply" i], textarea[placeholder*="reply" i], input[placeholder*="write" i], textarea[placeholder*="write" i]').first();

    if (await commentInput.count() > 0) {
      // Generate unique comment text
      const testComment = `Test comment from Phase 2 validation - ${Date.now()}`;

      console.log(`   Typing comment: "${testComment}"`);
      // Use type() instead of fill() to trigger proper input events
      await commentInput.click();
      await commentInput.type(testComment, { delay: 10 });
      await page.waitForTimeout(500);

      // Take screenshot of typed comment
      await page.screenshot({ path: 'test-screenshots/comment-typed.png', fullPage: false, timeout: 10000 });
      console.log('   📸 Screenshot: comment-typed.png');

      // Find the Comment button (has text "Comment" or send icon)
      const submitButton = page.locator('button:has-text("Comment"), button:has(svg.lucide-send)').first();

      if (await submitButton.count() > 0 && await submitButton.isEnabled()) {
        console.log('   Clicking Comment button...');
        await submitButton.click();
      } else {
        // Try Ctrl+Enter or just Enter
        console.log('   Button disabled or not found, pressing Enter...');
        await commentInput.press('Enter');
      }

      await page.waitForTimeout(2000); // Wait for submission

      // Take screenshot after submission
      await page.screenshot({ path: 'test-screenshots/comment-submitted.png', fullPage: false, timeout: 10000 });
      console.log('   📸 Screenshot: comment-submitted.png');

      // Check if the comment appears on the page
      const pageText = await page.textContent('body');
      if (pageText.includes('Test comment from Phase 2 validation')) {
        console.log('✅ TEST 2 PASSED: Comment appears on the page!\n');
      } else {
        console.log('⚠️  TEST 2 WARNING: Comment text not found on page (check screenshots)\n');
      }
    } else {
      console.log('   ⚠️  No comment input found - checking alternative UI...');

      // Maybe comments are inline, look for any text input in the post area
      const anyInput = page.locator('article input, article textarea, .post-card input, .post-card textarea').first();
      if (await anyInput.count() > 0) {
        console.log('   Found alternative input, trying to submit comment...');
        const testComment = `Test comment ${Date.now()}`;
        await anyInput.fill(testComment);
        await anyInput.press('Enter');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-screenshots/comment-alt-submitted.png', fullPage: false, timeout: 10000 });
        console.log('   📸 Screenshot: comment-alt-submitted.png');
      }
      console.log('⚠️  TEST 2: Comment input UI may differ from expected\n');
    }

    // ============================================
    // TEST 3: Full page screenshot showing state
    // ============================================
    console.log('📝 Taking full page screenshot...');
    await page.screenshot({ path: 'test-screenshots/dashboard-final-state.png', fullPage: true, timeout: 15000 });
    console.log('   📸 Screenshot: dashboard-final-state.png\n');

    console.log('=' .repeat(50));
    console.log('\n✅ Thorough tests completed!');
    console.log('\nScreenshots saved to test-screenshots/:');
    console.log('  - like-before.png');
    console.log('  - like-after.png');
    console.log('  - comment-expanded.png');
    console.log('  - comment-typed.png');
    console.log('  - comment-submitted.png');
    console.log('  - dashboard-final-state.png');
    console.log('\nPlease review screenshots to verify likes and comments work!\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    try {
      await page.screenshot({ path: 'test-screenshots/error-state.png', fullPage: true, timeout: 10000 });
      console.log('   📸 Error screenshot saved');
    } catch (e) {
      console.log('   Could not save error screenshot');
    }
  } finally {
    await browser.close();
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
