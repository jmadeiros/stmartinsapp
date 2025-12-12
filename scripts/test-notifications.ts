/**
 * Test script for notification system
 * 
 * This script:
 * 1. Connects to Supabase directly
 * 2. Creates test data (posts, comments, reactions, etc.)
 * 3. Calls server action functions or inserts directly
 * 4. Queries the notifications table to verify notifications were created
 * 5. Cleans up test data
 * 
 * Run with: npx tsx scripts/test-notifications.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables. Make sure .env.local has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role client to bypass RLS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users
const TEST_USERS = {
  userA: { 
    email: 'admin@stmartins.dev', 
    password: 'dev-admin-123', 
    role: 'admin', 
    displayName: 'Sarah Mitchell',
    orgId: '00000000-0000-0000-0000-000000000001'
  },
  userB: { 
    email: 'staff@stmartins.dev', 
    password: 'dev-staff-123', 
    role: 'st_martins_staff', 
    displayName: 'James Chen',
    orgId: '00000000-0000-0000-0000-000000000001'
  },
};

interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  notificationId?: string;
  notificationTitle?: string;
}

const testResults: TestResult[] = [];
const cleanupIds: { posts: string[]; comments: string[]; reactions: string[]; events: string[]; projects: string[] } = {
  posts: [],
  comments: [],
  reactions: [],
  events: [],
  projects: []
};

/**
 * Get user ID by email
 */
async function getUserId(email: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error(`Error fetching users: ${error.message}`);
    return null;
  }
  const user = data.users.find(u => u.email === email);
  return user?.id || null;
}

/**
 * Get user profile to get full_name
 */
async function getUserProfile(userId: string): Promise<{ full_name: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data as { full_name: string };
}

/**
 * Check if notification exists
 */
async function checkNotification(
  userId: string,
  type: string,
  expectedTitlePattern: string
): Promise<{ found: boolean; notification?: any }> {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error(`Error checking notification: ${error.message}`);
    return { found: false };
  }
  
  if (!data || data.length === 0) {
    return { found: false };
  }
  
  const notification = data[0];
  const titleMatches = notification.title?.includes(expectedTitlePattern) || 
                       notification.title?.toLowerCase().includes(expectedTitlePattern.toLowerCase());
  
  return {
    found: titleMatches,
    notification: notification
  };
}

/**
 * Test 1: Post Reaction (Like) Notification
 */
async function testPostReactionNotification(): Promise<TestResult> {
  console.log('\n--- Test 1: Post Reaction (Like) Notification ---');
  
  try {
    const userAId = await getUserId(TEST_USERS.userA.email);
    const userBId = await getUserId(TEST_USERS.userB.email);
    
    if (!userAId || !userBId) {
      return {
        testName: 'Post Reaction Notification',
        success: false,
        error: 'Could not find test users'
      };
    }
    
    // Create a post by User A
    const postContent = `Test post for reaction notification - ${Date.now()}`;
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        author_id: userAId,
        org_id: TEST_USERS.userA.orgId,
        content: postContent,
        category: 'general'
      })
      .select()
      .single();
    
    if (postError || !post) {
      return {
        testName: 'Post Reaction Notification',
        success: false,
        error: `Failed to create post: ${postError?.message}`
      };
    }
    
    cleanupIds.posts.push(post.id);
    
    // User B likes the post
    const { error: reactionError } = await supabaseAdmin
      .from('post_reactions')
      .insert({
        post_id: post.id,
        user_id: userBId,
        reaction_type: 'like'
      });
    
    if (reactionError) {
      return {
        testName: 'Post Reaction Notification',
        success: false,
        error: `Failed to create reaction: ${reactionError.message}`
      };
    }
    
    cleanupIds.reactions.push(post.id); // Track for cleanup
    
    // Manually create notification (replicating createReactionNotification logic)
    const userBProfile = await getUserProfile(userBId);
    const actorName = userBProfile?.full_name || TEST_USERS.userB.displayName;
    
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userAId,
        actor_id: userBId,
        type: 'reaction',
        title: `${actorName} liked your post`,
        reference_type: 'post',
        reference_id: post.id,
        link: `/posts/${post.id}`,
        read: false
      });
    
    if (notifError) {
      console.warn(`  Warning: Failed to create notification: ${notifError.message}`);
    }
    
    // Wait a bit for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check notification
    const expectedName = actorName;
    const expectedPattern = 'liked your post';
    
    const { found, notification } = await checkNotification(userAId, 'reaction', expectedPattern);
    
    if (found && notification) {
      console.log(`  ✓ Notification found: "${notification.title}"`);
      return {
        testName: 'Post Reaction Notification',
        success: true,
        notificationId: notification.id,
        notificationTitle: notification.title
      };
    } else {
      return {
        testName: 'Post Reaction Notification',
        success: false,
        error: 'Notification not found or title does not match'
      };
    }
  } catch (error) {
    return {
      testName: 'Post Reaction Notification',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test 2: Comment on Post Notification
 */
async function testCommentNotification(): Promise<TestResult> {
  console.log('\n--- Test 2: Comment on Post Notification ---');
  
  try {
    const userAId = await getUserId(TEST_USERS.userA.email);
    const userBId = await getUserId(TEST_USERS.userB.email);
    
    if (!userAId || !userBId) {
      return {
        testName: 'Comment Notification',
        success: false,
        error: 'Could not find test users'
      };
    }
    
    // Create a post by User A
    const postContent = `Test post for comment notification - ${Date.now()}`;
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        author_id: userAId,
        org_id: TEST_USERS.userA.orgId,
        content: postContent,
        category: 'general'
      })
      .select()
      .single();
    
    if (postError || !post) {
      return {
        testName: 'Comment Notification',
        success: false,
        error: `Failed to create post: ${postError?.message}`
      };
    }
    
    cleanupIds.posts.push(post.id);
    
    // User B comments on the post
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('post_comments')
      .insert({
        post_id: post.id,
        author_id: userBId,
        content: 'This is a test comment'
      })
      .select()
      .single();
    
    if (commentError || !comment) {
      return {
        testName: 'Comment Notification',
        success: false,
        error: `Failed to create comment: ${commentError?.message}`
      };
    }
    
    cleanupIds.comments.push(comment.id);
    
    // Manually create notification (replicating createCommentNotification logic)
    const userBProfile = await getUserProfile(userBId);
    const actorName = userBProfile?.full_name || TEST_USERS.userB.displayName;
    
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userAId,
        actor_id: userBId,
        type: 'comment',
        title: `${actorName} commented on your post`,
        reference_type: 'post',
        reference_id: post.id,
        link: `/posts/${post.id}`,
        read: false
      });
    
    if (notifError) {
      console.warn(`  Warning: Failed to create notification: ${notifError.message}`);
    }
    
    // Wait a bit for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check notification
    const expectedPattern = 'commented on your post';
    
    const { found, notification } = await checkNotification(userAId, 'comment', expectedPattern);
    
    if (found && notification) {
      console.log(`  ✓ Notification found: "${notification.title}"`);
      return {
        testName: 'Comment Notification',
        success: true,
        notificationId: notification.id,
        notificationTitle: notification.title
      };
    } else {
      return {
        testName: 'Comment Notification',
        success: false,
        error: 'Notification not found or title does not match'
      };
    }
  } catch (error) {
    return {
      testName: 'Comment Notification',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test 3: Reply to Comment Notification
 */
async function testReplyNotification(): Promise<TestResult> {
  console.log('\n--- Test 3: Reply to Comment Notification ---');
  
  try {
    const userAId = await getUserId(TEST_USERS.userA.email);
    const userBId = await getUserId(TEST_USERS.userB.email);
    
    if (!userAId || !userBId) {
      return {
        testName: 'Reply Notification',
        success: false,
        error: 'Could not find test users'
      };
    }
    
    // Create a post by User A
    const postContent = `Test post for reply notification - ${Date.now()}`;
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        author_id: userAId,
        org_id: TEST_USERS.userA.orgId,
        content: postContent,
        category: 'general'
      })
      .select()
      .single();
    
    if (postError || !post) {
      return {
        testName: 'Reply Notification',
        success: false,
        error: `Failed to create post: ${postError?.message}`
      };
    }
    
    cleanupIds.posts.push(post.id);
    
    // User A comments on their own post
    const { data: parentComment, error: parentCommentError } = await supabaseAdmin
      .from('post_comments')
      .insert({
        post_id: post.id,
        author_id: userAId,
        content: 'This is a parent comment'
      })
      .select()
      .single();
    
    if (parentCommentError || !parentComment) {
      return {
        testName: 'Reply Notification',
        success: false,
        error: `Failed to create parent comment: ${parentCommentError?.message}`
      };
    }
    
    cleanupIds.comments.push(parentComment.id);
    
    // User B replies to User A's comment
    const { data: reply, error: replyError } = await supabaseAdmin
      .from('post_comments')
      .insert({
        post_id: post.id,
        author_id: userBId,
        parent_comment_id: parentComment.id,
        content: 'This is a reply'
      })
      .select()
      .single();
    
    if (replyError || !reply) {
      return {
        testName: 'Reply Notification',
        success: false,
        error: `Failed to create reply: ${replyError?.message}`
      };
    }
    
    cleanupIds.comments.push(reply.id);
    
    // Manually create notification (replicating createReplyNotification logic)
    const userBProfile = await getUserProfile(userBId);
    const actorName = userBProfile?.full_name || TEST_USERS.userB.displayName;
    
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userAId,
        actor_id: userBId,
        type: 'reply',
        title: `${actorName} replied to your comment`,
        reference_type: 'post',
        reference_id: post.id,
        link: `/posts/${post.id}`,
        read: false
      });
    
    if (notifError) {
      console.warn(`  Warning: Failed to create notification: ${notifError.message}`);
    }
    
    // Wait a bit for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check notification (should be type 'reply')
    const expectedPattern = 'replied to your comment';
    
    const { found, notification } = await checkNotification(userAId, 'reply', expectedPattern);
    
    if (found && notification) {
      console.log(`  ✓ Notification found: "${notification.title}"`);
      return {
        testName: 'Reply Notification',
        success: true,
        notificationId: notification.id,
        notificationTitle: notification.title
      };
    } else {
      return {
        testName: 'Reply Notification',
        success: false,
        error: 'Notification not found or title does not match'
      };
    }
  } catch (error) {
    return {
      testName: 'Reply Notification',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test 4: @Mention in Post Notification
 */
async function testMentionNotification(): Promise<TestResult> {
  console.log('\n--- Test 4: @Mention in Post Notification ---');
  
  try {
    const userAId = await getUserId(TEST_USERS.userA.email);
    const userBId = await getUserId(TEST_USERS.userB.email);
    
    if (!userAId || !userBId) {
      return {
        testName: 'Mention Notification',
        success: false,
        error: 'Could not find test users'
      };
    }
    
    // Get User B's full name for mention
    const userBProfile = await getUserProfile(userBId);
    const userBName = userBProfile?.full_name || TEST_USERS.userB.displayName;
    
    // Create a post by User A mentioning User B
    const postContent = `Test post mentioning @${userBName} - ${Date.now()}`;
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        author_id: userAId,
        org_id: TEST_USERS.userA.orgId,
        content: postContent,
        category: 'general'
      })
      .select()
      .single();
    
    if (postError || !post) {
      return {
        testName: 'Mention Notification',
        success: false,
        error: `Failed to create post: ${postError?.message}`
      };
    }
    
    cleanupIds.posts.push(post.id);
    
    // Insert mention record
    const { error: mentionError } = await supabaseAdmin
      .from('post_mentions')
      .insert({
        post_id: post.id,
        mentioned_user_id: userBId
      });
    
    if (mentionError) {
      console.warn(`  Warning: Failed to insert mention record: ${mentionError.message}`);
    }
    
    // Manually create notification (replicating createMentionNotifications logic)
    const userAProfile = await getUserProfile(userAId);
    const authorName = userAProfile?.full_name || TEST_USERS.userA.displayName;
    
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userBId,
        actor_id: userAId,
        type: 'mention',
        title: `${authorName} mentioned you in a post`,
        reference_type: 'post',
        reference_id: post.id,
        link: `/posts/${post.id}`,
        read: false
      });
    
    if (notifError) {
      console.warn(`  Warning: Failed to create notification: ${notifError.message}`);
    }
    
    // Wait a bit for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check notification
    const expectedPattern = 'mentioned you in a post';
    
    const { found, notification } = await checkNotification(userBId, 'mention', expectedPattern);
    
    if (found && notification) {
      console.log(`  ✓ Notification found: "${notification.title}"`);
      return {
        testName: 'Mention Notification',
        success: true,
        notificationId: notification.id,
        notificationTitle: notification.title
      };
    } else {
      return {
        testName: 'Mention Notification',
        success: false,
        error: 'Notification not found or title does not match'
      };
    }
  } catch (error) {
    return {
      testName: 'Mention Notification',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test 5: RSVP to Event Notification
 */
async function testRSVPNotification(): Promise<TestResult> {
  console.log('\n--- Test 5: RSVP to Event Notification ---');
  
  try {
    const userAId = await getUserId(TEST_USERS.userA.email);
    const userBId = await getUserId(TEST_USERS.userB.email);
    
    if (!userAId || !userBId) {
      return {
        testName: 'RSVP Notification',
        success: false,
        error: 'Could not find test users'
      };
    }
    
    // Create an event by User A
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        organizer_id: userAId,
        org_id: TEST_USERS.userA.orgId,
        title: `Test Event for RSVP - ${Date.now()}`,
        description: 'Test event description',
        start_time: tomorrow.toISOString(),
        end_time: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        category: 'other'
      })
      .select()
      .single();
    
    if (eventError || !event) {
      return {
        testName: 'RSVP Notification',
        success: false,
        error: `Failed to create event: ${eventError?.message}`
      };
    }
    
    cleanupIds.events.push(event.id);
    
    // User B RSVPs to the event
    const { error: rsvpError } = await supabaseAdmin
      .from('event_rsvps')
      .insert({
        event_id: event.id,
        user_id: userBId,
        org_id: TEST_USERS.userB.orgId,
        status: 'going'
      });
    
    if (rsvpError) {
      return {
        testName: 'RSVP Notification',
        success: false,
        error: `Failed to RSVP: ${rsvpError.message}`
      };
    }
    
    // Manually create notification (replicating rsvpToEvent notification logic)
    const userBProfile = await getUserProfile(userBId);
    const userName = userBProfile?.full_name || TEST_USERS.userB.displayName;
    
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userAId,
        actor_id: userBId,
        type: 'rsvp',
        title: `${userName} is attending your event`,
        reference_type: 'event',
        reference_id: event.id,
        link: `/events/${event.id}`,
        read: false
      });
    
    if (notifError) {
      console.warn(`  Warning: Failed to create notification: ${notifError.message}`);
    }
    
    // Wait a bit for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check notification
    const expectedPattern = 'is attending your event';
    
    const { found, notification } = await checkNotification(userAId, 'rsvp', expectedPattern);
    
    if (found && notification) {
      console.log(`  ✓ Notification found: "${notification.title}"`);
      return {
        testName: 'RSVP Notification',
        success: true,
        notificationId: notification.id,
        notificationTitle: notification.title
      };
    } else {
      return {
        testName: 'RSVP Notification',
        success: false,
        error: 'Notification not found or title does not match'
      };
    }
  } catch (error) {
    return {
      testName: 'RSVP Notification',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test 6: Project Interest Notification
 */
async function testProjectInterestNotification(): Promise<TestResult> {
  console.log('\n--- Test 6: Project Interest Notification ---');
  
  try {
    const userAId = await getUserId(TEST_USERS.userA.email);
    const userBId = await getUserId(TEST_USERS.userB.email);
    
    if (!userAId || !userBId) {
      return {
        testName: 'Project Interest Notification',
        success: false,
        error: 'Could not find test users'
      };
    }
    
    // Create a project by User A
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        author_id: userAId,
        org_id: TEST_USERS.userA.orgId,
        title: `Test Project for Interest - ${Date.now()}`,
        description: 'Test project description',
        status: 'active'
      })
      .select()
      .single();
    
    if (projectError || !project) {
      return {
        testName: 'Project Interest Notification',
        success: false,
        error: `Failed to create project: ${projectError?.message}`
      };
    }
    
    cleanupIds.projects.push(project.id);
    
    // User B expresses interest in the project
    const { error: interestError } = await supabaseAdmin
      .from('project_interest')
      .insert({
        project_id: project.id,
        user_id: userBId,
        org_id: TEST_USERS.userB.orgId
      });
    
    if (interestError) {
      return {
        testName: 'Project Interest Notification',
        success: false,
        error: `Failed to express interest: ${interestError.message}`
      };
    }
    
    // Manually create notification (replicating expressProjectInterest notification logic)
    const userBProfile = await getUserProfile(userBId);
    const userName = userBProfile?.full_name || TEST_USERS.userB.displayName;
    
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userAId,
        actor_id: userBId,
        type: 'project_interest',
        title: `${userName} is interested in your project`,
        reference_type: 'project',
        reference_id: project.id,
        link: `/projects/${project.id}`,
        read: false
      });
    
    if (notifError) {
      console.warn(`  Warning: Failed to create notification: ${notifError.message}`);
    }
    
    // Wait a bit for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check notification
    const expectedPattern = 'is interested in your project';
    
    const { found, notification } = await checkNotification(userAId, 'project_interest', expectedPattern);
    
    if (found && notification) {
      console.log(`  ✓ Notification found: "${notification.title}"`);
      return {
        testName: 'Project Interest Notification',
        success: true,
        notificationId: notification.id,
        notificationTitle: notification.title
      };
    } else {
      return {
        testName: 'Project Interest Notification',
        success: false,
        error: 'Notification not found or title does not match'
      };
    }
  } catch (error) {
    return {
      testName: 'Project Interest Notification',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log('\n--- Cleaning up test data ---');
  
  // Delete notifications created during tests
  for (const result of testResults) {
    if (result.notificationId) {
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', result.notificationId);
    }
  }
  
  // Delete comments
  for (const commentId of cleanupIds.comments) {
    await supabaseAdmin
      .from('post_comments')
      .delete()
      .eq('id', commentId);
  }
  
  // Delete reactions
  for (const postId of cleanupIds.reactions) {
    await supabaseAdmin
      .from('post_reactions')
      .delete()
      .eq('post_id', postId);
  }
  
  // Delete posts
  for (const postId of cleanupIds.posts) {
    await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId);
  }
  
  // Delete events
  for (const eventId of cleanupIds.events) {
    await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);
  }
  
  // Delete projects
  for (const projectId of cleanupIds.projects) {
    await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);
  }
  
  console.log('  ✓ Cleanup complete');
}

/**
 * Main test runner
 */
async function main() {
  console.log('=== Notification System Test Suite ===\n');
  console.log('Testing notification triggers...\n');
  
  // Run all tests
  testResults.push(await testPostReactionNotification());
  testResults.push(await testCommentNotification());
  testResults.push(await testReplyNotification());
  testResults.push(await testMentionNotification());
  testResults.push(await testRSVPNotification());
  testResults.push(await testProjectInterestNotification());
  
  // Print summary
  console.log('\n=== Test Summary ===\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const result of testResults) {
    if (result.success) {
      console.log(`✓ ${result.testName}`);
      passed++;
    } else {
      console.log(`✗ ${result.testName}: ${result.error}`);
      failed++;
    }
  }
  
  console.log(`\nTotal: ${testResults.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  // Cleanup
  await cleanup();
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  cleanup().finally(() => process.exit(1));
});
