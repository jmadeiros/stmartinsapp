const { chromium } = require('playwright');

async function testCreatePost() {
  console.log('Starting Playwright test for post creation...\n');

  let browser;
  let context;
  let page;
  let success = false;
  let errorMessage = null;

  try {
    // Launch browser in headed mode (visible)
    console.log('Launching Chrome browser...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 500 // Slow down operations to see what's happening
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();

    // Step 1: Go to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/Users/josh/stmartinsapp/test-screenshots/01-login-page.png' });

    // Step 2: Click Development Login button
    console.log('Clicking Dev Login button...');
    const devLoginButton = await page.getByRole('button', { name: /dev login/i });

    if (!devLoginButton) {
      throw new Error('Dev Login button not found');
    }

    await devLoginButton.click();
    console.log('Waiting for redirect to dashboard...');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/Users/josh/stmartinsapp/test-screenshots/02-dashboard-loaded.png' });
    console.log('Successfully redirected to dashboard');

    // Step 3: Find the post creation textarea
    console.log('Looking for post creation textarea...');
    const textarea = await page.locator('textarea[placeholder*="Share an update"]').first();

    if (!textarea) {
      throw new Error('Post creation textarea not found');
    }

    await textarea.scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/Users/josh/stmartinsapp/test-screenshots/03-textarea-found.png' });

    // Step 4: Type a test message
    const timestamp = new Date().toISOString();
    const testMessage = `Test post from Playwright - ${timestamp}`;
    console.log(`Typing test message: "${testMessage}"`);

    await textarea.click();
    await textarea.fill(testMessage);
    await page.screenshot({ path: '/Users/josh/stmartinsapp/test-screenshots/04-message-typed.png' });

    // Step 5: Click the Post button
    console.log('Looking for Post button...');

    // Try multiple selectors for the Post button
    let postButton = await page.getByRole('button', { name: /^post$/i }).first();

    if (!postButton) {
      postButton = await page.locator('button:has-text("Post")').first();
    }

    if (!postButton) {
      throw new Error('Post button not found');
    }

    await postButton.scrollIntoViewIfNeeded();
    console.log('Clicking Post button...');
    await postButton.click();

    // Step 6: Wait for post to be created
    console.log('Waiting for post to be created...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/josh/stmartinsapp/test-screenshots/05-after-post-click.png' });

    // Step 7: Refresh the page
    console.log('Refreshing page to verify post appears...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/josh/stmartinsapp/test-screenshots/06-after-refresh.png' });

    // Step 8: Check if the post appears in the feed
    console.log('Searching for the new post in the feed...');
    const postContent = await page.locator(`text="${testMessage}"`).first();

    if (await postContent.isVisible({ timeout: 5000 })) {
      console.log('✅ SUCCESS: Post found in the feed!');
      await postContent.scrollIntoViewIfNeeded();
      await page.screenshot({ path: '/Users/josh/stmartinsapp/test-screenshots/07-post-found.png' });
      success = true;
    } else {
      throw new Error('Post not found in the feed after refresh');
    }

    // Keep browser open for a few seconds to see the result
    console.log('Waiting 3 seconds before closing browser...');
    await page.waitForTimeout(3000);

  } catch (error) {
    errorMessage = error.message;
    console.error('❌ ERROR:', error.message);

    if (page) {
      try {
        await page.screenshot({ path: '/Users/josh/stmartinsapp/test-screenshots/error-screenshot.png' });
        console.log('Error screenshot saved');
      } catch (screenshotError) {
        console.error('Could not save error screenshot:', screenshotError.message);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    if (errorMessage) {
      console.log(`Error: ${errorMessage}`);
    }
    console.log('Screenshots saved to: /Users/josh/stmartinsapp/test-screenshots/');
    console.log('='.repeat(60));

    process.exit(success ? 0 : 1);
  }
}

// Run the test
testCreatePost();



