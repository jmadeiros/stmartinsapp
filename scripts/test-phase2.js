#!/usr/bin/env node
/**
 * Phase 2 Validation Test
 * Tests that mock data has been removed and real Supabase is wired up
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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
  console.log('\n🧪 Phase 2 Validation Tests\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  const results = [];

  // Test 1: Dev Login API works
  results.push(await test('1. Dev Login API creates test users', async () => {
    const response = await fetch(`${BASE_URL}/api/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.email || !data.password) {
      throw new Error('Missing email or password in response');
    }
    if (!data.userId) {
      throw new Error('Missing userId - user not created in database');
    }
    if (!data.orgId) {
      throw new Error('Missing orgId - organization not linked');
    }
    if (data.role !== 'admin') {
      throw new Error(`Expected role 'admin', got '${data.role}'`);
    }
  }));

  // Test 2: All test user roles can be created
  results.push(await test('2. All 4 test user roles available', async () => {
    const roles = ['admin', 'st_martins_staff', 'partner_staff', 'volunteer'];

    for (const role of roles) {
      const response = await fetch(`${BASE_URL}/api/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        throw new Error(`Failed for role: ${role}`);
      }

      const data = await response.json();
      if (data.role !== role) {
        throw new Error(`Expected role '${role}', got '${data.role}'`);
      }
    }
  }));

  // Test 3: Dashboard page loads
  results.push(await test('3. Dashboard page loads without errors', async () => {
    const response = await fetch(`${BASE_URL}/dashboard`);

    if (!response.ok) {
      throw new Error(`Dashboard returned ${response.status}`);
    }

    const html = await response.text();

    // Should not contain error messages (check for specific error patterns)
    if (html.includes('Internal Server Error') || html.includes('Error: 500') || html.includes('Application error')) {
      throw new Error('Dashboard has server error');
    }

    // Should contain dashboard content
    if (!html.includes('Aitrium') && !html.includes('Village')) {
      throw new Error('Dashboard not rendering expected content');
    }
  }));

  // Test 4: Calendar page loads
  results.push(await test('4. Calendar page loads', async () => {
    const response = await fetch(`${BASE_URL}/calendar`);

    if (!response.ok) {
      throw new Error(`Calendar returned ${response.status}`);
    }
  }));

  // Test 5: People page loads
  results.push(await test('5. People page loads', async () => {
    const response = await fetch(`${BASE_URL}/people`);

    if (!response.ok) {
      throw new Error(`People returned ${response.status}`);
    }
  }));

  // Test 6: Projects page loads
  results.push(await test('6. Projects page loads', async () => {
    const response = await fetch(`${BASE_URL}/projects`);

    if (!response.ok) {
      throw new Error(`Projects returned ${response.status}`);
    }
  }));

  // Test 7: Chat page loads
  results.push(await test('7. Chat page loads', async () => {
    const response = await fetch(`${BASE_URL}/chat`);

    if (!response.ok) {
      throw new Error(`Chat returned ${response.status}`);
    }
  }));

  // Test 8: Check MOCK_FEED_ITEMS is removed from dashboard actions
  results.push(await test('8. Mock feed data removed from dashboard/actions.ts', async () => {
    const fs = require('fs');
    const path = require('path');

    const actionsPath = path.join(__dirname, '../src/app/(authenticated)/dashboard/actions.ts');
    const content = fs.readFileSync(actionsPath, 'utf-8');

    if (content.includes('MOCK_FEED_ITEMS')) {
      throw new Error('MOCK_FEED_ITEMS still exists in dashboard/actions.ts');
    }
  }));

  // Test 9: Check MOCK_PROJECTS is removed from projects page
  results.push(await test('9. Mock projects data removed from projects/page.tsx', async () => {
    const fs = require('fs');
    const path = require('path');

    const projectsPath = path.join(__dirname, '../src/app/(authenticated)/projects/page.tsx');
    const content = fs.readFileSync(projectsPath, 'utf-8');

    if (content.includes('MOCK_PROJECTS')) {
      throw new Error('MOCK_PROJECTS still exists in projects/page.tsx');
    }
  }));

  // Test 10: Check reactions server actions exist
  results.push(await test('10. Post reactions server actions wired up', async () => {
    const fs = require('fs');
    const path = require('path');

    const reactionsPath = path.join(__dirname, '../src/lib/actions/reactions.ts');

    if (!fs.existsSync(reactionsPath)) {
      throw new Error('reactions.ts does not exist');
    }

    const content = fs.readFileSync(reactionsPath, 'utf-8');

    if (!content.includes('toggleReaction')) {
      throw new Error('toggleReaction function not found');
    }
    if (!content.includes('getReactionData')) {
      throw new Error('getReactionData function not found');
    }
  }));

  // Test 11: Check comments server actions exist
  results.push(await test('11. Post comments server actions wired up', async () => {
    const fs = require('fs');
    const path = require('path');

    const commentsPath = path.join(__dirname, '../src/lib/actions/comments.ts');

    if (!fs.existsSync(commentsPath)) {
      throw new Error('comments.ts does not exist');
    }

    const content = fs.readFileSync(commentsPath, 'utf-8');

    if (!content.includes('getComments')) {
      throw new Error('getComments function not found');
    }
    if (!content.includes('addComment')) {
      throw new Error('addComment function not found');
    }
  }));

  // Test 12: Check notifications server actions exist
  results.push(await test('12. Notifications server actions wired up', async () => {
    const fs = require('fs');
    const path = require('path');

    const notificationsPath = path.join(__dirname, '../src/lib/actions/notifications.ts');

    if (!fs.existsSync(notificationsPath)) {
      throw new Error('notifications.ts does not exist');
    }

    const content = fs.readFileSync(notificationsPath, 'utf-8');

    if (!content.includes('getUnreadNotificationCount')) {
      throw new Error('getUnreadNotificationCount function not found');
    }
  }));

  // Test 13: Check header has badge count wiring
  results.push(await test('13. Header badge counts wired to real data', async () => {
    const fs = require('fs');
    const path = require('path');

    const headerPath = path.join(__dirname, '../src/components/social/header.tsx');
    const content = fs.readFileSync(headerPath, 'utf-8');

    if (!content.includes('getUnreadNotificationCount')) {
      throw new Error('Header not importing getUnreadNotificationCount');
    }
    if (!content.includes('getUnreadChatCount')) {
      throw new Error('Header not importing getUnreadChatCount');
    }
    if (!content.includes('notificationCount')) {
      throw new Error('notificationCount state not found in header');
    }
  }));

  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;

  if (passed === total) {
    console.log(`\n🎉 All ${total} tests passed! Phase 2 wiring is complete.\n`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${passed}/${total} tests passed. Some Phase 2 work may be incomplete.\n`);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
