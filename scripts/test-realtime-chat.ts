/**
 * Direct Realtime Chat Test
 * 
 * Tests Supabase realtime messaging without browser automation
 * by using the Supabase client directly.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('REALTIME CHAT VALIDATION TEST');
console.log('='.repeat(60));
console.log('');
console.log('Supabase URL:', SUPABASE_URL);
console.log('');

// Test users
const USERS = {
  sarah: { email: 'admin@stmartins.dev', password: 'dev-admin-123', name: 'Sarah (Admin)' },
  james: { email: 'staff@stmartins.dev', password: 'dev-staff-123', name: 'James (Staff)' }
};

interface TestResult {
  step: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logResult(result: TestResult) {
  const icon = result.passed ? '✅' : '❌';
  const duration = result.duration ? ` (${result.duration}ms)` : '';
  console.log(`${icon} ${result.step}: ${result.message}${duration}`);
  results.push(result);
}

async function createAuthenticatedClient(email: string, password: string): Promise<SupabaseClient | null> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error(`Failed to login as ${email}:`, error.message);
    return null;
  }
  
  log(`Logged in as ${email}`);
  return client;
}

async function getOrCreateGeneralChannel(client: SupabaseClient, orgId: string, createdBy: string): Promise<string | null> {
  // Look for #general channel (is_group = true for channels)
  const { data: existing } = await client
    .from('conversations')
    .select('id')
    .eq('is_group', true)
    .eq('name', 'general')
    .eq('org_id', orgId)
    .maybeSingle();
  
  if (existing) {
    log(`Found existing #general channel: ${existing.id}`);
    return existing.id;
  }
  
  // Create it if not exists
  log('Creating #general channel...');
  const { data: created, error } = await client
    .from('conversations')
    .insert({
      name: 'general',
      is_group: true,
      org_id: orgId,
      created_by: createdBy
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create general channel:', error.message);
    return null;
  }
  
  // Add creator as participant
  if (created) {
    await client.from('conversation_participants').insert({
      conversation_id: created.id,
      user_id: createdBy
    });
  }
  
  return created?.id || null;
}

async function runTest() {
  log('Starting realtime chat validation...');
  console.log('');
  
  // Step 1: Login as Sarah (User A)
  const startLogin1 = Date.now();
  const sarahClient = await createAuthenticatedClient(USERS.sarah.email, USERS.sarah.password);
  if (!sarahClient) {
    logResult({ step: 'STEP 1', passed: false, message: 'Failed to login as Sarah' });
    return;
  }
  logResult({ 
    step: 'STEP 1', 
    passed: true, 
    message: `Logged in as ${USERS.sarah.name}`,
    duration: Date.now() - startLogin1
  });
  
  // Get Sarah's user info
  const { data: { user: sarahUser } } = await sarahClient.auth.getUser();
  if (!sarahUser) {
    logResult({ step: 'STEP 1b', passed: false, message: 'Could not get Sarah user info' });
    return;
  }
  
  // Get Sarah's org
  const { data: sarahProfile } = await sarahClient
    .from('profiles')
    .select('org_id')
    .eq('id', sarahUser.id)
    .single();
  
  const orgId = sarahProfile?.org_id || '00000000-0000-0000-0000-000000000001';
  
  // Step 2: Login as James (User B)
  const startLogin2 = Date.now();
  const jamesClient = await createAuthenticatedClient(USERS.james.email, USERS.james.password);
  if (!jamesClient) {
    logResult({ step: 'STEP 2', passed: false, message: 'Failed to login as James' });
    return;
  }
  logResult({ 
    step: 'STEP 2', 
    passed: true, 
    message: `Logged in as ${USERS.james.name}`,
    duration: Date.now() - startLogin2
  });
  
  const { data: { user: jamesUser } } = await jamesClient.auth.getUser();
  if (!jamesUser) {
    logResult({ step: 'STEP 2b', passed: false, message: 'Could not get James user info' });
    return;
  }
  
  // Step 3: Get or create #general channel
  const channelId = await getOrCreateGeneralChannel(sarahClient, orgId, sarahUser.id);
  if (!channelId) {
    logResult({ step: 'STEP 3', passed: false, message: 'Could not get/create #general channel' });
    return;
  }
  logResult({ step: 'STEP 3', passed: true, message: `Using #general channel (${channelId.substring(0, 8)}...)` });
  
  // Make sure James is also a participant - use Sarah's client since she created the conversation
  log(`Adding James as participant to conversation ${channelId}...`);
  const { data: participantData, error: participantError } = await sarahClient
    .from('conversation_participants')
    .upsert({
      conversation_id: channelId,
      user_id: jamesUser.id,
      org_id: orgId  // Required field
    }, { onConflict: 'conversation_id,user_id' })
    .select();
  
  if (participantError) {
    log(`⚠️  Error adding James as participant: ${participantError.message}`);
  } else {
    log(`✅ James added as participant by Sarah`);
  }
  
  // Verify James can see the conversation
  const { data: canSeeConv, error: convError } = await jamesClient
    .from('conversations')
    .select('id, name')
    .eq('id', channelId)
    .single();
  
  if (canSeeConv) {
    log(`✅ James can see conversation: ${canSeeConv.name}`);
  } else {
    log(`❌ James cannot see conversation! Error: ${convError?.message}`);
    log(`   This means RLS is blocking access - realtime won't work either`);
  }
  
  // Step 4: James subscribes to realtime on messages
  let receivedMessage: any = null;
  let subscription: any = null;
  let timeoutId: NodeJS.Timeout;
  
  const messageReceivedPromise = new Promise<boolean>((resolve) => {
    timeoutId = setTimeout(() => {
      log('❌ Timeout waiting for realtime message (10 seconds)');
      if (subscription) {
        jamesClient.removeChannel(subscription);
      }
      resolve(false);
    }, 10000);
    
    // Subscribe to ALL messages first (no filter) to test if realtime works at all
    subscription = jamesClient
      .channel(`realtime-test-${Date.now()}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
          // Removed filter to test if realtime works at all
        }, 
        (payload) => {
          // Check if this message is for our channel
          if (payload.new.conversation_id === channelId) {
            log(`🔔 James received realtime event!`);
            log(`   Message ID: ${payload.new.id}`);
            log(`   Content: ${(payload.new.content || '').substring(0, 50)}...`);
            receivedMessage = payload.new;
            clearTimeout(timeoutId);
            if (subscription) {
              jamesClient.removeChannel(subscription);
            }
            resolve(true);
          } else {
            log(`Received event for different conversation: ${payload.new.conversation_id}`);
          }
        }
      )
      .subscribe((status) => {
        log(`Subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          log('✅ Realtime subscription active!');
        }
      });
  });
  
  logResult({ step: 'STEP 4', passed: true, message: 'James subscribed to realtime on #general' });
  
  // Give subscription time to establish
  log('Waiting 2 seconds for subscription to establish...');
  await new Promise(r => setTimeout(r, 2000));
  
  // Step 5: Sarah sends a message
  const testMessage = `Realtime test ${Date.now()} - Hello from Sarah!`;
  const startSend = Date.now();
  
  log(`Attempting to insert message into conversation ${channelId}...`);
  // Use same pattern as sendMessage in src/lib/queries/chat.ts
  const { data: sentMessage, error: sendError } = await sarahClient
    .from('messages' as any)
    .insert({
      conversation_id: channelId,
      sender_id: sarahUser.id,
      content: testMessage,
      reply_to_id: null,
      attachments: []
    })
    .select()
    .single();
  
  if (sendError) {
    log(`❌ Insert error: ${sendError.message}`);
    log(`   Code: ${sendError.code}`);
    log(`   Details: ${JSON.stringify(sendError)}`);
    logResult({ step: 'STEP 5', passed: false, message: `Failed to send message: ${sendError.message}` });
    return;
  }
  
  if (!sentMessage) {
    logResult({ step: 'STEP 5', passed: false, message: 'Message insert returned no data' });
    return;
  }
  
  log(`✅ Message inserted successfully! ID: ${sentMessage.id}`);
  logResult({ 
    step: 'STEP 5', 
    passed: true, 
    message: `Sarah sent: "${testMessage.substring(0, 40)}..." (ID: ${sentMessage.id.substring(0, 8)}...)`,
    duration: Date.now() - startSend
  });
  
  // Step 6: Wait for James to receive the message via realtime
  log('Waiting for James to receive message via realtime...');
  const startWait = Date.now();
  const received = await messageReceivedPromise;
  
  if (received && receivedMessage) {
    logResult({ 
      step: 'STEP 6 - REALTIME', 
      passed: true, 
      message: `🎉 James received message in REALTIME! Content: "${(receivedMessage.content || '').substring(0, 40)}..."`,
      duration: Date.now() - startWait
    });
  } else {
    // Check if message exists in database (to verify it was saved and visible to James)
    log(`Checking if James can see the message in DB...`);
    const { data: dbMessages, error: dbError } = await jamesClient
      .from('messages')
      .select('id, content, created_at, conversation_id, sender_id')
      .eq('conversation_id', channelId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    log(`James can see ${dbMessages?.length || 0} messages in this conversation`);
    
    if (dbMessages && dbMessages.length > 0) {
      const found = dbMessages.find(m => m.id === sentMessage?.id);
      if (found) {
        log(`✅ Message found in DB (James can see it): ${found.content.substring(0, 50)}...`);
        log(`   This means RLS is OK, but realtime events are NOT being delivered.`);
        log(`   Possible causes:`);
        log(`   1. Realtime service needs restart`);
        log(`   2. RLS policies blocking realtime events (need to allow supabase_realtime role)`);
        log(`   3. Publication not fully synced`);
        logResult({ 
          step: 'STEP 6 - REALTIME', 
          passed: false, 
          message: `Message exists in DB and James can see it, but realtime did NOT deliver it. This is a realtime delivery issue, not RLS.`
        });
      } else {
        log(`Found ${dbMessages.length} recent messages but not the one we sent (ID: ${sentMessage?.id})`);
        log(`   This suggests RLS might be filtering it out, OR it's in a different conversation`);
        logResult({ 
          step: 'STEP 6 - REALTIME', 
          passed: false, 
          message: `Message not visible to James. May be RLS issue or wrong conversation.`
        });
      }
    } else {
      log(`DB Error: ${dbError?.message || 'No messages found'}`);
      log(`   This suggests RLS is blocking James from seeing messages`);
      logResult({ 
        step: 'STEP 6 - REALTIME', 
        passed: false, 
        message: `James cannot see messages. RLS may be blocking access. Error: ${dbError?.message || 'Unknown'}`
      });
    }
  }
  
  // Cleanup
  await sarahClient.auth.signOut();
  await jamesClient.auth.signOut();
  
  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');
  
  if (failed === 0) {
    console.log('🎉🎉🎉 ALL TESTS PASSED! REALTIME IS WORKING! 🎉🎉🎉');
  } else {
    console.log('❌ Some tests failed. Check the output above.');
  }
  
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

runTest().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});

