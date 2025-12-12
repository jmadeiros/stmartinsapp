#!/usr/bin/env node
/**
 * Debug test for like button - captures console logs
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function devLogin(page, role = 'admin') {
  const apiResponse = await page.request.post(`${BASE_URL}/api/dev-login`, {
    data: { role }
  });
  const { email, password } = await apiResponse.json();

  const authResponse = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    data: { email, password },
  });

  const authData = await authResponse.json();
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];

  await page.context().addCookies([{
    name: `sb-${projectRef}-auth-token`,
    value: JSON.stringify(authData),
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);

  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(({ authData, projectRef }) => {
    localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(authData));
  }, { authData, projectRef });

  return { email, authData };
}

async function run() {
  console.log('\n🔍 Debug Like Button Test\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (text.includes('error') || text.includes('Error') || text.includes('fail')) {
      console.log(`🔴 CONSOLE: ${text}`);
    }
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log(`🔴 NETWORK FAIL: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Capture responses
  page.on('response', response => {
    if (response.url().includes('supabase') && response.status() >= 400) {
      console.log(`🔴 API ERROR: ${response.status()} ${response.url()}`);
    }
  });

  try {
    // Login
    console.log('🔐 Logging in...');
    await devLogin(page, 'admin');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ Logged in\n');

    // Find like button
    console.log('Finding like button...');
    const likeButton = page.locator('button:has(svg.lucide-heart)').first();
    await likeButton.waitFor({ timeout: 10000 });

    // Get the reaction count span
    const countSpan = likeButton.locator('span');
    const countBefore = await countSpan.textContent();
    console.log(`Like count BEFORE: ${countBefore}`);

    // Click like
    console.log('\nClicking like button...');
    await likeButton.click();

    // Wait for server action
    console.log('Waiting for server action...');
    await page.waitForTimeout(3000);

    // Get count after
    const countAfter = await countSpan.textContent();
    console.log(`Like count AFTER: ${countAfter}`);

    // Check if button style changed (heart should be red/filled)
    const heartSvg = likeButton.locator('svg.lucide-heart');
    const heartClass = await heartSvg.getAttribute('class');
    console.log(`Heart classes: ${heartClass}`);

    if (heartClass?.includes('fill-red') || heartClass?.includes('text-red')) {
      console.log('✅ Heart is now RED (liked state)');
    } else {
      console.log('⚠️ Heart is NOT red');
    }

    // Print relevant console logs
    console.log('\n📋 Relevant Console Logs:');
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('reaction') ||
      log.includes('toggle') ||
      log.includes('error') ||
      log.includes('Error') ||
      log.includes('success') ||
      log.includes('fail')
    );

    if (relevantLogs.length > 0) {
      relevantLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (no relevant logs captured)');
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    if (countBefore !== countAfter) {
      console.log(`✅ Count changed: ${countBefore} -> ${countAfter}`);
    } else {
      console.log(`❌ Count did NOT change: ${countBefore} -> ${countAfter}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\nClosing browser in 3 seconds...');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

run();
