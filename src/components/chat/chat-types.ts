// Chat types for frontend components

export interface ChatUser {
  id: string
  name: string
  avatar?: string
  initials: string
  isOnline: boolean
  role?: string
  organization?: string
}

export interface Reaction {
  emoji: string
  count: number
  users: string[]
  hasReacted: boolean
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  sender: ChatUser
  content: string
  timestamp: Date
  isEdited?: boolean
  replyToId?: string
  replyTo?: Message
  reactions: Reaction[]
  attachments?: {
    type: 'image' | 'file'
    url: string
    name: string
    size?: number
  }[]
  mentions?: string[]
}

export interface Conversation {
  id: string
  type: 'channel' | 'dm' | 'group'
  name: string
  description?: string
  avatar?: string
  participants: ChatUser[]
  lastMessage?: Message
  unreadCount: number
  isPinned?: boolean
  isMuted?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TypingIndicator {
  conversationId: string
  user: ChatUser
  isTyping: boolean
}

// Database-compatible types (maps to Supabase schema)
export interface DbChatUser {
  user_id: string
  full_name: string
  avatar_url: string | null
  job_title: string | null
  organization_name: string | null
  is_online?: boolean
}

export interface DbConversation {
  id: string
  name: string | null
  is_group: boolean
  org_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  archived: boolean
}

export interface DbMessage {
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

// Helper to convert DB user to ChatUser
export function dbUserToChatUser(dbUser: DbChatUser | null): ChatUser {
  if (!dbUser) {
    return {
      id: 'unknown',
      name: 'Unknown User',
      initials: '??',
      isOnline: false,
    }
  }

  const nameParts = dbUser.full_name.split(' ')
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : dbUser.full_name.substring(0, 2).toUpperCase()

  return {
    id: dbUser.user_id,
    name: dbUser.full_name,
    avatar: dbUser.avatar_url || undefined,
    initials,
    isOnline: dbUser.is_online || false,
    role: dbUser.job_title || undefined,
    organization: dbUser.organization_name || undefined,
  }
}

// Helper to convert DB conversation to Conversation
export function dbConversationToConversation(
  dbConv: DbConversation,
  participants: ChatUser[],
  currentUserId: string,
  unreadCount: number = 0,
  lastMessage?: Message
): Conversation {
  // Determine conversation type
  let type: 'channel' | 'dm' | 'group' = 'dm'
  if (dbConv.name && (dbConv.name === 'general' || dbConv.name.startsWith('#'))) {
    type = 'channel'
  } else if (dbConv.is_group) {
    type = 'group'
  }

  // Determine display name
  let displayName = dbConv.name || ''
  if (type === 'dm') {
    // For DMs, use the other participant's name
    const otherParticipant = participants.find(p => p.id !== currentUserId)
    displayName = otherParticipant?.name || 'Direct Message'
  } else if (type === 'group' && !dbConv.name) {
    // For unnamed groups, list participant names
    displayName = participants
      .filter(p => p.id !== currentUserId)
      .map(p => p.name.split(' ')[0])
      .join(', ')
  }

  return {
    id: dbConv.id,
    type,
    name: displayName,
    description: type === 'channel' ? getChannelDescription(dbConv.name) : undefined,
    participants,
    lastMessage,
    unreadCount,
    isPinned: dbConv.name === 'general', // Pin the general channel
    createdAt: new Date(dbConv.created_at),
    updatedAt: new Date(dbConv.updated_at),
  }
}

// Helper to convert DB message to Message
export function dbMessageToMessage(
  dbMsg: DbMessage,
  sender: ChatUser
): Message {
  return {
    id: dbMsg.id,
    conversationId: dbMsg.conversation_id,
    senderId: dbMsg.sender_id,
    sender,
    content: dbMsg.content,
    timestamp: new Date(dbMsg.created_at),
    isEdited: !!dbMsg.edited_at,
    replyToId: dbMsg.reply_to_id || undefined,
    reactions: [], // Reactions would need separate fetch
    attachments: dbMsg.attachments?.length ? dbMsg.attachments.map((a: any) => ({
      type: a.type || 'file',
      url: a.url,
      name: a.name,
      size: a.size,
    })) : undefined,
  }
}

// Helper to get channel descriptions
function getChannelDescription(name: string | null): string {
  switch (name) {
    case 'general':
      return 'Building-wide announcements and casual chat'
    case 'events':
      return 'Event coordination and updates'
    case 'resources':
      return 'Share and request resources'
    case 'volunteers':
      return 'Volunteer coordination'
    default:
      return ''
  }
}



