/**
 * REALTIME CHAT VALIDATION TEST
 * 
 * Purpose: Validate that Supabase realtime is working for chat messages
 * after enabling realtime publication on:
 * - messages
 * - conversations
 * - conversation_participants
 * - conversation_unread
 * 
 * Test Flow:
 * 1. User A (Admin/Sarah) and User B (Staff/James) log in via separate contexts
 * 2. Both navigate to the same chat channel (#general)
 * 3. User A sends a message
 * 4. User B should see the message appear WITHOUT page refresh
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Test configuration
const APP_BASE_URL = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = 'test-screenshots/realtime-validation';

// User roles
const USER_A = { role: 'admin', name: 'Sarah (Admin)' };
const USER_B = { role: 'st_martins_staff', name: 'James (Staff)' };

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Helper to take timestamped screenshots
async function screenshot(page: Page, name: string): Promise<string> {
  const timestamp = Date.now();
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`[Screenshot] ${filepath}`);
  return filepath;
}

// Helper to log with timestamp
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

/**
 * Performs dev login using the API approach (same as chat.spec.ts)
 */
async function devLogin(page: Page, role: string): Promise<{ userId: string; email: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment');
  }

  // Navigate to login page first
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  // Call the dev-login API to get credentials for the specified role
  const apiResponse = await page.request.post(`${APP_BASE_URL}/api/dev-login`, {
    headers: { 'Content-Type': 'application/json' },
    data: { role }
  });

  if (!apiResponse.ok()) {
    throw new Error(`Dev login API failed: ${await apiResponse.text()}`);
  }

  const apiData = await apiResponse.json();
  const { email, password, userId } = apiData;

  // Sign in using Supabase's REST API
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

  const authData = await authResponse.json();
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'default';

  // Set auth data in browser localStorage
  await page.evaluate(
    ({ authData, projectRef }) => {
      const storageKey = `sb-${projectRef}-auth-token`;
      localStorage.setItem(storageKey, JSON.stringify(authData));
      
      // Also set a backup key format some versions use
      localStorage.setItem(`supabase.auth.token`, JSON.stringify({
        currentSession: authData,
        expiresAt: authData.expires_at,
      }));
    },
    { authData, projectRef }
  );

  log(`Logged in as ${role} (${email})`);
  return { userId, email };
}

/**
 * Navigate to chat page
 */
async function navigateToChat(page: Page): Promise<boolean> {
  await page.goto('/chat');
  await page.waitForLoadState('domcontentloaded');

  try {
    // Wait for chat UI elements to appear - use more specific locators
    await Promise.race([
      page.locator('h2:has-text("Messages")').waitFor({ timeout: 20000 }),
      page.locator('button:has-text("Channels")').waitFor({ timeout: 20000 }),
      page.locator('button:has-text("Direct Messages")').waitFor({ timeout: 20000 }),
      page.locator('textarea[placeholder*="Message"]').waitFor({ timeout: 20000 }),
    ]);
    await page.waitForTimeout(2000);
    log('Chat page loaded successfully');
    return true;
  } catch (error) {
    log('Failed to load chat page', error);
    return false;
  }
}

/**
 * Select a channel by name
 */
async function selectChannel(page: Page, channelName: string): Promise<boolean> {
  const channelButton = page.locator(`button:has-text("#${channelName}"), button:has-text("${channelName}")`).first();
  
  if (await channelButton.count() > 0) {
    await channelButton.click();
    await page.waitForTimeout(1000);
    return true;
  }
  
  // Fallback: click first channel
  const anyChannel = page.locator('button:has(svg.lucide-hash)').first();
  if (await anyChannel.count() > 0) {
    await anyChannel.click();
    await page.waitForTimeout(1000);
    return true;
  }
  
  return false;
}

/**
 * Send a message in the current chat
 */
async function sendMessage(page: Page, message: string): Promise<boolean> {
  const messageInput = page.locator('textarea[placeholder*="Message"]').first();
  
  if (await messageInput.count() === 0) {
    log('Message input not found');
    return false;
  }
  
  await messageInput.fill(message);
  await page.waitForTimeout(300);
  await messageInput.press('Enter');
  await page.waitForTimeout(1000);
  
  log(`Sent message: ${message.substring(0, 50)}...`);
  return true;
}

/**
 * Wait for a message to appear in the chat WITHOUT refreshing
 */
async function waitForMessage(page: Page, messageText: string, timeoutMs: number = 15000): Promise<boolean> {
  log(`Waiting for message: "${messageText.substring(0, 30)}..."`)
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    // Look for the message in the chat area
    const messageLocator = page.locator(`text="${messageText}"`);
    const count = await messageLocator.count();
    
    if (count > 0) {
      log(`✅ Message found after ${Date.now() - startTime}ms`);
      return true;
    }
    
    await page.waitForTimeout(500);
  }
  
  log(`❌ Message NOT found after ${timeoutMs}ms`);
  return false;
}

// Configure tests to run serially (order matters for shared state)
test.describe.configure({ mode: 'serial' });

test.describe('Realtime Chat Validation', () => {
  // Increase timeout for these complex tests
  test.setTimeout(180000);
  
  let browser: Browser;
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;
  
  // Shared test data
  let testMessage = '';
  
  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    
    // Create two separate browser contexts (simulates two different browser sessions)
    contextA = await browser.newContext();
    contextB = await browser.newContext();
    
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();
    
    log('='.repeat(60));
    log('REALTIME CHAT VALIDATION TEST');
    log('='.repeat(60));
    log('Created two browser contexts for User A and User B');
  });
  
  test.afterAll(async () => {
    await contextA?.close();
    await contextB?.close();
    log('Closed browser contexts');
    log('='.repeat(60));
  });
  
  test('STEP 1: User A (Sarah/Admin) logs in', async () => {
    log('--- STEP 1: User A Login ---');
    
    await devLogin(pageA, USER_A.role);
    await screenshot(pageA, '01-userA-logged-in');
    
    log(`${USER_A.name} logged in successfully`);
  });
  
  test('STEP 2: User B (James/Staff) logs in', async () => {
    log('--- STEP 2: User B Login ---');
    
    await devLogin(pageB, USER_B.role);
    await screenshot(pageB, '02-userB-logged-in');
    
    log(`${USER_B.name} logged in successfully`);
  });
  
  test('STEP 3: User A navigates to chat', async () => {
    log('--- STEP 3: User A goes to Chat ---');
    
    const chatLoaded = await navigateToChat(pageA);
    expect(chatLoaded).toBe(true);
    
    const channelSelected = await selectChannel(pageA, 'general');
    expect(channelSelected).toBe(true);
    
    await screenshot(pageA, '03-userA-in-chat');
    log(`${USER_A.name} is in the chat channel`);
  });
  
  test('STEP 4: User B navigates to chat', async () => {
    log('--- STEP 4: User B goes to Chat ---');
    
    const chatLoaded = await navigateToChat(pageB);
    expect(chatLoaded).toBe(true);
    
    const channelSelected = await selectChannel(pageB, 'general');
    expect(channelSelected).toBe(true);
    
    await screenshot(pageB, '04-userB-in-chat');
    log(`${USER_B.name} is in the chat channel`);
  });
  
  test('STEP 5: User A sends a message', async () => {
    log('--- STEP 5: User A Sends Message ---');
    
    testMessage = `Realtime test ${Date.now()} - Hello from Sarah!`;
    
    await screenshot(pageA, '05-userA-before-send');
    const sent = await sendMessage(pageA, testMessage);
    expect(sent).toBe(true);
    await screenshot(pageA, '06-userA-after-send');
    
    log(`${USER_A.name} sent: "${testMessage}"`);
  });
  
  test('STEP 6: User B receives message in REALTIME (no refresh)', async () => {
    log('--- STEP 6: REALTIME VALIDATION ---');
    log('Checking if User B receives the message WITHOUT page refresh...');
    
    await screenshot(pageB, '07-userB-before-check');
    
    // This is the key test - the message should appear in User B's view
    // WITHOUT refreshing the page (thanks to Supabase Realtime)
    const received = await waitForMessage(pageB, testMessage, 15000);
    
    await screenshot(pageB, '08-userB-after-check');
    
    if (received) {
      log('');
      log('🎉🎉🎉 REALTIME IS WORKING! 🎉🎉🎉');
      log(`${USER_B.name} received the message in REALTIME (no page refresh needed)`);
      log('');
    } else {
      log('');
      log('⚠️ Message not received in realtime. Checking if it exists after refresh...');
      
      // Refresh and check if message exists at all
      await pageB.reload();
      await pageB.waitForLoadState('domcontentloaded');
      await selectChannel(pageB, 'general');
      
      const existsAfterRefresh = await waitForMessage(pageB, testMessage, 5000);
      await screenshot(pageB, '09-userB-after-refresh');
      
      if (existsAfterRefresh) {
        log('Message exists after refresh - realtime subscription may not be working correctly');
      } else {
        log('Message not found even after refresh - there may be a database issue');
      }
    }
    
    expect(received).toBe(true);
  });
  
  test('STEP 7: User B replies, User A receives in realtime', async () => {
    log('--- STEP 7: Bidirectional Test ---');
    
    const replyMessage = `Reply from James ${Date.now()}`;
    
    await screenshot(pageB, '10-userB-before-reply');
    const sent = await sendMessage(pageB, replyMessage);
    expect(sent).toBe(true);
    await screenshot(pageB, '11-userB-after-reply');
    
    log(`${USER_B.name} sent reply: "${replyMessage}"`);
    
    // Check if User A receives it in realtime
    await screenshot(pageA, '12-userA-before-receive');
    const received = await waitForMessage(pageA, replyMessage, 15000);
    await screenshot(pageA, '13-userA-after-receive');
    
    if (received) {
      log(`✅ ${USER_A.name} received the reply in REALTIME!`);
    } else {
      log(`❌ ${USER_A.name} did NOT receive the reply in realtime`);
    }
    
    expect(received).toBe(true);
  });
  
  test('FINAL: Test Summary', async () => {
    log('');
    log('='.repeat(60));
    log('REALTIME CHAT VALIDATION COMPLETE');
    log('='.repeat(60));
    log('');
    log('What was tested:');
    log('1. Two users logged in with separate sessions');
    log('2. Both navigated to the same #general channel');
    log('3. User A (Sarah) sent message → User B (James) received in realtime');
    log('4. User B (James) replied → User A (Sarah) received in realtime');
    log('');
    log('Tables in supabase_realtime publication:');
    log('  ✅ messages');
    log('  ✅ conversations');
    log('  ✅ conversation_participants');
    log('  ✅ conversation_unread');
    log('');
    log('Screenshots saved to: test-screenshots/realtime-validation/');
    log('='.repeat(60));
  });
});
