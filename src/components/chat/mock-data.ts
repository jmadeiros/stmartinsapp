import type { ChatUser, Conversation, Message } from './chat-types'

// Mock current user
export const currentUser: ChatUser = {
  id: 'current-user',
  name: 'Michael Green',
  initials: 'MG',
  avatar: '/placeholder.svg?height=40&width=40',
  isOnline: true,
  role: 'Community Manager',
  organization: 'St Martins Village',
}

// Mock users
export const mockUsers: ChatUser[] = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    initials: 'SJ',
    avatar: '/placeholder.svg?height=40&width=40',
    isOnline: true,
    role: 'Project Lead',
    organization: 'Oasis Housing',
  },
  {
    id: 'user-2',
    name: 'David Lee',
    initials: 'DL',
    avatar: '/placeholder.svg?height=40&width=40',
    isOnline: true,
    role: 'Volunteer Coordinator',
    organization: 'Food Bank Alliance',
  },
  {
    id: 'user-3',
    name: 'Emma Wilson',
    initials: 'EW',
    avatar: '/placeholder.svg?height=40&width=40',
    isOnline: false,
    role: 'Events Manager',
    organization: 'Youth Outreach',
  },
  {
    id: 'user-4',
    name: 'James Chen',
    initials: 'JC',
    avatar: '/placeholder.svg?height=40&width=40',
    isOnline: true,
    role: 'Program Director',
    organization: 'Skills Training Hub',
  },
  {
    id: 'user-5',
    name: 'Lisa Martinez',
    initials: 'LM',
    avatar: '/placeholder.svg?height=40&width=40',
    isOnline: false,
    role: 'Admin',
    organization: 'St Martins Village',
  },
]

// Mock conversations
export const mockConversations: Conversation[] = [
  {
    id: 'channel-general',
    type: 'channel',
    name: 'general',
    description: 'Building-wide announcements and casual chat',
    participants: [...mockUsers, currentUser],
    unreadCount: 3,
    isPinned: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'channel-events',
    type: 'channel',
    name: 'events',
    description: 'Event coordination and updates',
    participants: [...mockUsers, currentUser],
    unreadCount: 0,
    isPinned: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'channel-resources',
    type: 'channel',
    name: 'resources',
    description: 'Share and request resources',
    participants: [...mockUsers, currentUser],
    unreadCount: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'channel-volunteers',
    type: 'channel',
    name: 'volunteers',
    description: 'Volunteer coordination',
    participants: [...mockUsers, currentUser],
    unreadCount: 0,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
  },
  {
    id: 'dm-sarah',
    type: 'dm',
    name: 'Sarah Johnson',
    participants: [mockUsers[0], currentUser],
    unreadCount: 2,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date(),
  },
  {
    id: 'dm-david',
    type: 'dm',
    name: 'David Lee',
    participants: [mockUsers[1], currentUser],
    unreadCount: 0,
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date(),
  },
  {
    id: 'dm-emma',
    type: 'dm',
    name: 'Emma Wilson',
    participants: [mockUsers[2], currentUser],
    unreadCount: 0,
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date(),
  },
  {
    id: 'group-food-drive',
    type: 'group',
    name: 'Food Drive Planning',
    participants: [mockUsers[0], mockUsers[1], mockUsers[3], currentUser],
    unreadCount: 5,
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date(),
  },
]

const createMessage = (
  id: string,
  conversationId: string,
  sender: ChatUser,
  content: string,
  timestamp: Date,
  options?: {
    reactions?: { emoji: string; count: number; users: string[]; hasReacted: boolean }[]
    mentions?: string[]
  }
): Message => ({
  id,
  conversationId,
  senderId: sender.id,
  sender,
  content,
  timestamp,
  reactions: options?.reactions || [],
  mentions: options?.mentions,
})

export const mockGeneralMessages: Message[] = [
  createMessage('msg-1', 'channel-general', mockUsers[0],
    'Good morning everyone! Just a reminder that the building-wide meeting is at 2pm today in the main hall.',
    new Date(Date.now() - 3600000 * 5),
    { reactions: [{ emoji: '👍', count: 8, users: ['user-2', 'user-3'], hasReacted: true }] }
  ),
  createMessage('msg-2', 'channel-general', mockUsers[1],
    'Thanks for the reminder Sarah! Will the meeting be recorded?',
    new Date(Date.now() - 3600000 * 4.5)
  ),
  createMessage('msg-3', 'channel-general', mockUsers[0],
    'Yes! Recording will be on the shared drive by end of day.',
    new Date(Date.now() - 3600000 * 4)
  ),
  createMessage('msg-4', 'channel-general', mockUsers[3],
    'Quick update: Skills Training Hub has extra office supplies if anyone needs them!',
    new Date(Date.now() - 3600000 * 2),
    { reactions: [{ emoji: '🙏', count: 5, users: ['user-1'], hasReacted: false }] }
  ),
  createMessage('msg-5', 'channel-general', currentUser,
    "That's great @James Chen! We could use some notebooks for our workshop.",
    new Date(Date.now() - 3600000 * 1.5),
    { mentions: ['user-4'] }
  ),
  createMessage('msg-6', 'channel-general', mockUsers[3],
    "Perfect! I'll set some aside for you.",
    new Date(Date.now() - 3600000 * 1)
  ),
  createMessage('msg-7', 'channel-general', mockUsers[2],
    "Hey everyone! Youth Outreach is celebrating our 5th anniversary next Friday. You're all invited! 🎉",
    new Date(Date.now() - 1800000),
    { reactions: [{ emoji: '🎉', count: 12, users: ['user-1', 'user-2', 'current-user'], hasReacted: true }] }
  ),
  createMessage('msg-8', 'channel-general', mockUsers[4],
    "Congratulations on 5 years! Count me in! 🙌",
    new Date(Date.now() - 900000)
  ),
]

export const mockSarahMessages: Message[] = [
  createMessage('dm-sarah-1', 'dm-sarah', mockUsers[0],
    'Hey Michael! Do you have a few minutes to chat about the Community Garden project?',
    new Date(Date.now() - 86400000 * 2)
  ),
  createMessage('dm-sarah-2', 'dm-sarah', currentUser,
    "Hi Sarah! Of course, what's on your mind?",
    new Date(Date.now() - 86400000 * 2 + 300000)
  ),
  createMessage('dm-sarah-3', 'dm-sarah', mockUsers[0],
    'I was thinking we could partner with the Food Bank Alliance. They have volunteers interested in gardening.',
    new Date(Date.now() - 86400000 * 2 + 600000)
  ),
  createMessage('dm-sarah-4', 'dm-sarah', currentUser,
    "That's a brilliant idea! David mentioned they need more engagement opportunities.",
    new Date(Date.now() - 86400000 * 2 + 900000)
  ),
  createMessage('dm-sarah-5', 'dm-sarah', mockUsers[0],
    'Should we set up a meeting with him this week?',
    new Date(Date.now() - 86400000 * 2 + 1200000)
  ),
  createMessage('dm-sarah-6', 'dm-sarah', currentUser,
    "Yes! I'll reach out to him today.",
    new Date(Date.now() - 86400000 * 2 + 1500000)
  ),
  createMessage('dm-sarah-7', 'dm-sarah', mockUsers[0],
    'Perfect! Thanks Michael. Talk soon! 👋',
    new Date(Date.now() - 86400000 * 2 + 1800000),
    { reactions: [{ emoji: '👍', count: 1, users: ['current-user'], hasReacted: true }] }
  ),
  createMessage('dm-sarah-8', 'dm-sarah', mockUsers[0],
    'Hey! Following up - did you talk to David?',
    new Date(Date.now() - 3600000)
  ),
  createMessage('dm-sarah-9', 'dm-sarah', mockUsers[0],
    'Found this helpful article about community gardens!',
    new Date(Date.now() - 1800000)
  ),
]

export const mockGroupMessages: Message[] = [
  createMessage('group-1', 'group-food-drive', mockUsers[1],
    "Team, I've started a shared doc for planning. Add your availability!",
    new Date(Date.now() - 86400000)
  ),
  createMessage('group-2', 'group-food-drive', mockUsers[0],
    "Just added mine! I'm free most mornings.",
    new Date(Date.now() - 86400000 + 1800000)
  ),
  createMessage('group-3', 'group-food-drive', mockUsers[3],
    'Added! I might get some volunteers from Skills Training Hub to help.',
    new Date(Date.now() - 86400000 + 3600000)
  ),
  createMessage('group-4', 'group-food-drive', currentUser,
    'Great progress! @David Lee can you confirm the venue booking for Dec 15th?',
    new Date(Date.now() - 43200000),
    { mentions: ['user-2'] }
  ),
  createMessage('group-5', 'group-food-drive', mockUsers[1],
    'Yes! Confirmed - main hall from 9am to 5pm.',
    new Date(Date.now() - 36000000),
    { reactions: [{ emoji: '🎉', count: 3, users: ['user-1', 'user-4', 'current-user'], hasReacted: true }] }
  ),
  createMessage('group-6', 'group-food-drive', mockUsers[0],
    "Amazing! I'll work on promotion materials this week.",
    new Date(Date.now() - 7200000)
  ),
  createMessage('group-7', 'group-food-drive', mockUsers[3],
    'Let me know if you need design help - I have Canva templates!',
    new Date(Date.now() - 3600000)
  ),
]

export const getMessagesForConversation = (conversationId: string): Message[] => {
  switch (conversationId) {
    case 'channel-general':
      return mockGeneralMessages
    case 'dm-sarah':
      return mockSarahMessages
    case 'group-food-drive':
      return mockGroupMessages
    default:
      return [createMessage(`${conversationId}-1`, conversationId, mockUsers[0],
        'No messages yet. Start the conversation!', new Date())]
  }
}



