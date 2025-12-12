import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Use 'any' to accept both browser and server client types
type Client = any

// Chat-specific types (these tables exist in DB but types may not be generated yet)
export interface ChatConversation {
  id: string
  name: string | null
  is_group: boolean
  org_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  archived: boolean
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachments: any[]
  reply_to_id: string | null
  edited_at: string | null
  deleted_at: string | null
  created_at: string
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  org_id: string
  joined_at: string
  last_read_at: string | null
  muted: boolean
}

export interface ConversationUnread {
  conversation_id: string
  user_id: string
  unread_count: number
  last_message_id: string | null
  updated_at: string
}

// Combined types for UI
export interface ChatConversationWithDetails extends ChatConversation {
  participants: Array<{
    user_id: string
    profile: {
      user_id: string
      full_name: string
      avatar_url: string | null
      job_title: string | null
      organization_id: string | null
      organization?: { name: string } | null
    } | null
  }>
  last_message?: ChatMessage | null
  unread_count?: number
}

export interface ChatMessageWithSender extends ChatMessage {
  sender: {
    user_id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    organization?: { name: string } | null
  } | null
}

// Well-known conversation IDs for building-wide channels
export const GENERAL_CHANNEL_NAME = 'general'
export const GENERAL_CHANNEL_DESCRIPTION = 'Building-wide announcements and casual chat'

/**
 * Get or create the #general channel for an organization
 */
export async function getOrCreateGeneralChannel(
  supabase: Client,
  orgId: string,
  userId: string
): Promise<{ data: ChatConversation | null; error: Error | null }> {
  try {
    // First, try to find existing general channel
    const { data: existing, error: findError } = await supabase
      .from('conversations' as any)
      .select('*')
      .eq('name', GENERAL_CHANNEL_NAME)
      .eq('org_id', orgId)
      .eq('archived', false)
      .single()

    if (existing) {
      return { data: existing as unknown as ChatConversation, error: null }
    }

    // If not found, create it
    const { data: created, error: createError } = await supabase
      .from('conversations' as any)
      .insert({
        name: GENERAL_CHANNEL_NAME,
        is_group: true,
        org_id: orgId,
        created_by: userId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating general channel:', createError)
      return { data: null, error: createError }
    }

    return { data: created as unknown as ChatConversation, error: null }
  } catch (error) {
    console.error('Error in getOrCreateGeneralChannel:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  supabase: Client,
  userId: string,
  orgId: string
): Promise<{ data: ChatConversationWithDetails[] | null; error: Error | null }> {
  try {
    // Get conversations where user is a participant
    const { data: participations, error: partError } = await supabase
      .from('conversation_participants' as any)
      .select('conversation_id')
      .eq('user_id', userId)
      .eq('org_id', orgId)

    if (partError) {
      console.error('Error fetching participations:', partError)
      return { data: null, error: partError }
    }

    if (!participations || participations.length === 0) {
      return { data: [], error: null }
    }

    const conversationIds = participations.map((p: any) => p.conversation_id)

    // Fetch conversations with details
    const { data: conversations, error: convError } = await supabase
      .from('conversations' as any)
      .select('*')
      .in('id', conversationIds)
      .eq('archived', false)
      .order('updated_at', { ascending: false })

    if (convError) {
      console.error('Error fetching conversations:', convError)
      return { data: null, error: convError }
    }

    // Enrich with participants and last message
    const enrichedConversations: ChatConversationWithDetails[] = []

    for (const conv of (conversations || []) as any[]) {
      // Get participants
      const { data: participants } = await supabase
        .from('conversation_participants' as any)
        .select(`
          user_id,
          profile:user_profiles!conversation_participants_user_id_fkey (
            user_id,
            full_name,
            avatar_url,
            job_title,
            organization_id,
            organization:organizations!user_profiles_organization_id_fkey (name)
          )
        `)
        .eq('conversation_id', conv.id)

      // Get last message
      const { data: lastMessages } = await supabase
        .from('messages' as any)
        .select('*')
        .eq('conversation_id', conv.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)

      // Get unread count
      const { data: unreadData } = await supabase
        .from('conversation_unread' as any)
        .select('unread_count')
        .eq('conversation_id', conv.id)
        .eq('user_id', userId)
        .single()

      enrichedConversations.push({
        ...conv,
        participants: (participants || []).map((p: any) => ({
          user_id: p.user_id,
          profile: p.profile
        })),
        last_message: (lastMessages as any)?.[0] || null,
        unread_count: (unreadData as any)?.unread_count || 0,
      } as ChatConversationWithDetails)
    }

    return { data: enrichedConversations, error: null }
  } catch (error) {
    console.error('Error in getUserConversations:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  supabase: Client,
  conversationId: string,
  options?: {
    limit?: number
    before?: string // message ID for pagination
  }
): Promise<{ data: ChatMessageWithSender[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('messages' as any)
      .select(`
        *,
        sender:user_profiles!messages_sender_id_fkey (
          user_id,
          full_name,
          avatar_url,
          job_title,
          organization:organizations!user_profiles_organization_id_fkey (name)
        )
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(options?.limit ?? 50)

    if (options?.before) {
      // Get the created_at of the 'before' message for pagination
      const { data: beforeMsg } = await supabase
        .from('messages' as any)
        .select('created_at')
        .eq('id', options.before)
        .single()

      if (beforeMsg) {
        query = query.lt('created_at', (beforeMsg as any).created_at)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return { data: null, error }
    }

    return { data: data as unknown as ChatMessageWithSender[], error: null }
  } catch (error) {
    console.error('Error in getConversationMessages:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  supabase: Client,
  params: {
    conversationId: string
    senderId: string
    content: string
    replyToId?: string
    attachments?: any[]
  }
): Promise<{ data: ChatMessage | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('messages' as any)
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        content: params.content,
        reply_to_id: params.replyToId || null,
        attachments: params.attachments || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return { data: null, error }
    }

    // Update conversation's updated_at
    await supabase
      .from('conversations' as any)
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.conversationId)

    return { data: data as unknown as ChatMessage, error: null }
  } catch (error) {
    console.error('Error in sendMessage:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Start a new DM conversation
 */
export async function startDirectMessage(
  supabase: Client,
  params: {
    userId: string
    otherUserId: string
    orgId: string
  }
): Promise<{ data: ChatConversation | null; error: Error | null }> {
  try {
    // Check if a DM already exists between these two users
    const { data: existingParticipations } = await supabase
      .from('conversation_participants' as any)
      .select('conversation_id')
      .eq('user_id', params.userId)
      .eq('org_id', params.orgId)

    if (existingParticipations) {
      for (const p of existingParticipations as any[]) {
        // Check if the other user is also in this conversation
        const { data: otherParticipant } = await supabase
          .from('conversation_participants' as any)
          .select('conversation_id')
          .eq('conversation_id', p.conversation_id)
          .eq('user_id', params.otherUserId)
          .single()

        if (otherParticipant) {
          // Check if it's a DM (not a group)
          const { data: conv } = await supabase
            .from('conversations' as any)
            .select('*')
            .eq('id', (otherParticipant as any).conversation_id)
            .eq('is_group', false)
            .eq('archived', false)
            .single()

          if (conv) {
            return { data: conv as unknown as ChatConversation, error: null }
          }
        }
      }
    }

    // No existing DM found, create a new one using the start_conversation function
    const { data, error } = await supabase.rpc('start_conversation', {
      p_participant_user_ids: [params.userId, params.otherUserId],
      p_org_id: params.orgId,
      p_is_group: false,
      p_name: undefined as any,
    })

    if (error) {
      console.error('Error starting DM:', error)
      return { data: null, error }
    }

    // Fetch the created conversation
    const { data: newConv, error: fetchError } = await supabase
      .from('conversations' as any)
      .select('*')
      .eq('id', data)
      .single()

    if (fetchError) {
      console.error('Error fetching new conversation:', fetchError)
      return { data: null, error: fetchError }
    }

    return { data: newConv as unknown as ChatConversation, error: null }
  } catch (error) {
    console.error('Error in startDirectMessage:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Mark conversation as read (update last_read_at)
 */
export async function markConversationAsRead(
  supabase: Client,
  conversationId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // Update last_read_at in conversation_participants
    const { error: partError } = await supabase
      .from('conversation_participants' as any)
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)

    if (partError) {
      console.error('Error updating last_read_at:', partError)
    }

    // Reset unread count
    const { error: unreadError } = await supabase
      .from('conversation_unread' as any)
      .upsert({
        conversation_id: conversationId,
        user_id: userId,
        unread_count: 0,
        updated_at: new Date().toISOString(),
      })

    if (unreadError) {
      console.error('Error resetting unread count:', unreadError)
    }

    return { error: null }
  } catch (error) {
    console.error('Error in markConversationAsRead:', error)
    return { error: error as Error }
  }
}

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToConversationMessages(
  supabase: Client,
  conversationId: string,
  callback: (message: ChatMessageWithSender) => void
): RealtimeChannel {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload: { new: { id: string } }) => {
        // Fetch the full message with sender details
        const { data } = await supabase
          .from('messages' as any)
          .select(`
            *,
            sender:user_profiles!messages_sender_id_fkey (
              user_id,
              full_name,
              avatar_url,
              job_title,
              organization:organizations!user_profiles_organization_id_fkey (name)
            )
          `)
          .eq('id', payload.new.id)
          .single()

        if (data) {
          callback(data as unknown as ChatMessageWithSender)
        }
      }
    )
    .subscribe()
}

/**
 * Subscribe to conversation updates (for unread counts, etc.)
 */
export function subscribeToUserConversations(
  supabase: Client,
  userId: string,
  callback: (update: { conversationId: string; unreadCount: number }) => void
): RealtimeChannel {
  return supabase
    .channel(`conversation_unread:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_unread',
        filter: `user_id=eq.${userId}`,
      },
      (payload: { new: ConversationUnread }) => {
        const data = payload.new
        callback({
          conversationId: data.conversation_id,
          unreadCount: data.unread_count,
        })
      }
    )
    .subscribe()
}

/**
 * Get all users in an organization (for starting new DMs)
 */
export async function getOrganizationUsers(
  supabase: Client,
  orgId: string
): Promise<{
  data: Array<{
    user_id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    organization_name: string | null
    is_online?: boolean
  }> | null
  error: Error | null
}> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        full_name,
        avatar_url,
        job_title,
        last_active_at,
        organization:organizations!user_profiles_organization_id_fkey (name)
      `)
      .eq('organization_id', orgId)

    if (error) {
      console.error('Error fetching organization users:', error)
      return { data: null, error }
    }

    const users = (data || []).map((u: any) => ({
      user_id: u.user_id,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      job_title: u.job_title,
      organization_name: u.organization?.name || null,
      // Consider online if active in last 5 minutes
      is_online: u.last_active_at
        ? new Date(u.last_active_at).getTime() > Date.now() - 5 * 60 * 1000
        : false,
    }))

    return { data: users, error: null }
  } catch (error) {
    console.error('Error in getOrganizationUsers:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Add user to conversation (for joining channels)
 */
export async function joinConversation(
  supabase: Client,
  conversationId: string,
  userId: string,
  orgId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('conversation_participants' as any)
      .upsert({
        conversation_id: conversationId,
        user_id: userId,
        org_id: orgId,
        joined_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error joining conversation:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('Error in joinConversation:', error)
    return { error: error as Error }
  }
}
