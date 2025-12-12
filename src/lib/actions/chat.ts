'use server'

import { createClient } from "@/lib/supabase/server"
import {
  getOrCreateGeneralChannel,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  startDirectMessage,
  markConversationAsRead,
  getOrganizationUsers,
  joinConversation,
  GENERAL_CHANNEL_NAME,
  type ChatConversation,
  type ChatConversationWithDetails,
  type ChatMessageWithSender,
} from "@/lib/queries/chat"

/**
 * Initialize chat for a user - ensures they're in the #general channel
 */
export async function initializeChat(userId: string, orgId: string) {
  const supabase = await createClient()

  try {
    // Get or create the #general channel
    const { data: generalChannel, error: channelError } = await getOrCreateGeneralChannel(
      supabase,
      orgId,
      userId
    )

    if (channelError) {
      console.error('[initializeChat] Error with general channel:', channelError)
      return { success: false, error: channelError.message }
    }

    if (generalChannel) {
      // Ensure user is a participant in #general
      const { error: joinError } = await joinConversation(
        supabase,
        generalChannel.id,
        userId,
        orgId
      )

      if (joinError) {
        console.error('[initializeChat] Error joining general channel:', joinError)
        // Don't fail initialization for this
      }
    }

    return { success: true, generalChannelId: generalChannel?.id }
  } catch (error) {
    console.error('[initializeChat] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all conversations for the current user
 */
export async function fetchUserConversations(userId: string, orgId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await getUserConversations(supabase, userId, orgId)

    if (error) {
      console.error('[fetchUserConversations] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('[fetchUserConversations] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Get messages for a conversation
 */
export async function fetchConversationMessages(
  conversationId: string,
  options?: { limit?: number; before?: string }
) {
  const supabase = await createClient()

  try {
    const { data, error } = await getConversationMessages(
      supabase,
      conversationId,
      options
    )

    if (error) {
      console.error('[fetchConversationMessages] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('[fetchConversationMessages] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Send a message to a conversation
 */
export async function sendChatMessage(params: {
  conversationId: string
  senderId: string
  content: string
  replyToId?: string
  mentions?: string[]
}) {
  const supabase = await createClient()

  try {
    const { data, error } = await sendMessage(supabase, {
      conversationId: params.conversationId,
      senderId: params.senderId,
      content: params.content,
      replyToId: params.replyToId,
    })

    if (error) {
      console.error('[sendChatMessage] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('[sendChatMessage] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Start a new direct message conversation
 */
export async function startNewDM(params: {
  userId: string
  otherUserId: string
  orgId: string
}) {
  const supabase = await createClient()

  try {
    const { data, error } = await startDirectMessage(supabase, params)

    if (error) {
      console.error('[startNewDM] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('[startNewDM] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Mark a conversation as read
 */
export async function markAsRead(conversationId: string, userId: string) {
  const supabase = await createClient()

  try {
    const { error } = await markConversationAsRead(
      supabase,
      conversationId,
      userId
    )

    if (error) {
      console.error('[markAsRead] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[markAsRead] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all users in the organization for starting new DMs
 */
export async function fetchOrganizationUsers(orgId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await getOrganizationUsers(supabase, orgId)

    if (error) {
      console.error('[fetchOrganizationUsers] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('[fetchOrganizationUsers] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Get the current authenticated user with their profile
 */
export async function getCurrentChatUser() {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated', data: null }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        full_name,
        avatar_url,
        job_title,
        organization_id,
        organization:organizations!user_profiles_organization_id_fkey (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('[getCurrentChatUser] Profile error:', profileError)
      return { success: false, error: profileError.message, data: null }
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        profile: profile as any,
      },
      error: null
    }
  } catch (error) {
    console.error('[getCurrentChatUser] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Get the total count of unread messages across all conversations for a user
 */
export async function getUnreadChatCount(userId: string) {
  const supabase = await createClient()

  try {
    // Get all unread counts for the user's conversations
    // TODO: conversation_unread table doesn't exist yet - return 0 for now
    // When the table is created, this can be updated to:
    // const { data, error } = await supabase
    //   .from('conversation_unread')
    //   .select('unread_count')
    //   .eq('user_id', userId)

    // For now, check if we have any messages table to count unread from
    // If not, just return 0
    return { success: true, count: 0, error: null }
  } catch (error) {
    console.error('[getUnreadChatCount] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    }
  }
}
