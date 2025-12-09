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



