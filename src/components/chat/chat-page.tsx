"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { ConversationList } from "./conversation-list"
import { ChatView } from "./chat-view"
import { SocialHeader } from "@/components/social/header"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  initializeChat,
  fetchUserConversations,
  fetchConversationMessages,
  sendChatMessage,
  startNewDM,
  markAsRead,
  getCurrentChatUser,
} from "@/lib/actions/chat"
import {
  subscribeToConversationMessages,
  subscribeToUserConversations,
} from "@/lib/queries/chat"
import type { Conversation, Message, ChatUser } from "./chat-types"
import {
  dbUserToChatUser,
  dbConversationToConversation,
  dbMessageToMessage,
} from "./chat-types"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Mock data imports for fallback
import {
  mockConversations,
  currentUser as mockCurrentUser,
  mockUsers,
  getMessagesForConversation,
} from "./mock-data"

// Default org ID for development
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001"

export function ChatPage() {
  // State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useMockData, setUseMockData] = useState(false)

  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null)
  const [orgId, setOrgId] = useState<string>(DEFAULT_ORG_ID)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [typingUsers, setTypingUsers] = useState<ChatUser[]>([])

  // Refs for real-time subscriptions
  const supabaseRef = useRef(createClient())
  const messageSubscriptionRef = useRef<RealtimeChannel | null>(null)
  const conversationSubscriptionRef = useRef<RealtimeChannel | null>(null)

  // Initialize chat on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true)
      setError(null)

      try {
        // Get current user
        const userResult = await getCurrentChatUser()

        if (!userResult.success || !userResult.data) {
          console.log("No authenticated user, falling back to mock data")
          setUseMockData(true)
          setCurrentUser(mockCurrentUser)
          setConversations(mockConversations)
          setActiveConversation(mockConversations[0])
          setMessages(getMessagesForConversation(mockConversations[0].id))
          setIsLoading(false)
          return
        }

        const user = userResult.data
        const profile = user.profile as any

        // Convert to ChatUser
        const chatUser: ChatUser = {
          id: user.id,
          name: profile?.full_name || user.email || 'User',
          initials: getInitials(profile?.full_name || user.email || 'U'),
          isOnline: true,
          role: profile?.job_title || undefined,
          organization: profile?.organization?.name || undefined,
          avatar: profile?.avatar_url || undefined,
        }
        setCurrentUser(chatUser)

        // Set org ID
        const userOrgId = profile?.organization_id || profile?.organization?.id || DEFAULT_ORG_ID
        setOrgId(userOrgId)

        // Initialize chat (creates #general if needed)
        await initializeChat(user.id, userOrgId)

        // Fetch conversations
        const convResult = await fetchUserConversations(user.id, userOrgId)

        if (!convResult.success || !convResult.data || convResult.data.length === 0) {
          console.log("No conversations found, falling back to mock data")
          setUseMockData(true)
          setConversations(mockConversations)
          setActiveConversation(mockConversations[0])
          setMessages(getMessagesForConversation(mockConversations[0].id))
          setIsLoading(false)
          return
        }

        // Convert DB conversations to UI format
        const uiConversations: Conversation[] = convResult.data.map((dbConv: any) => {
          const participants = (dbConv.participants || []).map((p: any) =>
            dbUserToChatUser(p.profile ? {
              user_id: p.profile.user_id,
              full_name: p.profile.full_name,
              avatar_url: p.profile.avatar_url,
              job_title: p.profile.job_title,
              organization_name: p.profile.organization?.name || null,
              is_online: false, // Would need presence tracking
            } : null)
          )

          // Add current user to participants if not there
          if (!participants.some((p: ChatUser) => p.id === user.id)) {
            participants.push(chatUser)
          }

          return dbConversationToConversation(
            dbConv,
            participants,
            user.id,
            dbConv.unread_count || 0,
            dbConv.last_message ? dbMessageToMessage(dbConv.last_message, chatUser) : undefined
          )
        })

        setConversations(uiConversations)

        // Select first conversation (preferably #general)
        const generalChannel = uiConversations.find(c => c.name === 'general' || c.type === 'channel')
        const firstConv = generalChannel || uiConversations[0]

        if (firstConv) {
          setActiveConversation(firstConv)
          await loadMessages(firstConv.id)
        }

        // Set up conversation subscription
        conversationSubscriptionRef.current = subscribeToUserConversations(
          supabaseRef.current,
          user.id,
          (update) => {
            setConversations(prev => prev.map(c =>
              c.id === update.conversationId
                ? { ...c, unreadCount: update.unreadCount }
                : c
            ))
          }
        )
      } catch (err) {
        console.error("Error initializing chat:", err)
        setError("Failed to load chat. Using demo mode.")
        setUseMockData(true)
        setCurrentUser(mockCurrentUser)
        setConversations(mockConversations)
        setActiveConversation(mockConversations[0])
        setMessages(getMessagesForConversation(mockConversations[0].id))
      } finally {
        setIsLoading(false)
      }
    }

    init()

    // Cleanup subscriptions on unmount
    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe()
      }
      if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (useMockData) {
      setMessages(getMessagesForConversation(conversationId))
      return
    }

    try {
      const result = await fetchConversationMessages(conversationId)

      if (result.success && result.data && currentUser) {
        const uiMessages: Message[] = result.data.map((dbMsg: any) => {
          const sender = dbMsg.sender ? dbUserToChatUser({
            user_id: dbMsg.sender.user_id,
            full_name: dbMsg.sender.full_name,
            avatar_url: dbMsg.sender.avatar_url,
            job_title: dbMsg.sender.job_title,
            organization_name: dbMsg.sender.organization?.name || null,
          }) : currentUser

          return dbMessageToMessage(dbMsg, sender)
        })
        setMessages(uiMessages)
      }
    } catch (err) {
      console.error("Error loading messages:", err)
    }
  }, [currentUser, useMockData])

  // Subscribe to messages when conversation changes
  useEffect(() => {
    if (!activeConversation || useMockData || !currentUser) return

    // Unsubscribe from previous conversation
    if (messageSubscriptionRef.current) {
      messageSubscriptionRef.current.unsubscribe()
    }

    // Subscribe to new conversation
    messageSubscriptionRef.current = subscribeToConversationMessages(
      supabaseRef.current,
      activeConversation.id,
      (newMessage: any) => {
        const sender = newMessage.sender ? dbUserToChatUser({
          user_id: newMessage.sender.user_id,
          full_name: newMessage.sender.full_name,
          avatar_url: newMessage.sender.avatar_url,
          job_title: newMessage.sender.job_title,
          organization_name: newMessage.sender.organization?.name || null,
        }) : currentUser

        const uiMessage = dbMessageToMessage(newMessage, sender)

        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === uiMessage.id)) {
            return prev
          }
          return [...prev, uiMessage]
        })
      }
    )

    // Mark conversation as read
    if (currentUser) {
      markAsRead(activeConversation.id, currentUser.id)
    }

    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe()
      }
    }
    // We intentionally use activeConversation?.id to only re-subscribe when the ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id, useMockData, currentUser])

  // Handle selecting a conversation
  const handleSelectConversation = useCallback(async (conversation: Conversation) => {
    setActiveConversation(conversation)
    setShowMobileChat(true)
    setTypingUsers([])

    await loadMessages(conversation.id)

    // Mark as read
    if (currentUser && !useMockData) {
      markAsRead(conversation.id, currentUser.id)
      setConversations(prev => prev.map(c =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      ))
    }
  }, [currentUser, loadMessages, useMockData])

  // Handle sending a message
  const handleSendMessage = useCallback(async (content: string, mentions?: string[]) => {
    if (!activeConversation || !currentUser) return

    if (useMockData) {
      // Mock mode - add message locally
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        sender: currentUser,
        content,
        timestamp: new Date(),
        reactions: [],
        mentions,
      }
      setMessages(prev => [...prev, newMessage])
      setTypingUsers([])

      // Simulate reply for DMs
      if (activeConversation.type === "dm") {
        setTimeout(() => {
          const otherUser = activeConversation.participants.find(p => p.id !== currentUser.id)
          if (otherUser) {
            setTypingUsers([otherUser])
          }
        }, 1000)
      }
      return
    }

    // Real mode - send to database
    try {
      const result = await sendChatMessage({
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        content,
        mentions,
      })

      if (!result.success) {
        console.error("Failed to send message:", result.error)
        // Optionally show error toast
      }
      // Message will be added via real-time subscription
    } catch (err) {
      console.error("Error sending message:", err)
    }
  }, [activeConversation, currentUser, useMockData])

  // Handle reactions
  const handleReact = useCallback((messageId: string, emoji: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId) return msg

        const existingReaction = msg.reactions.find(r => r.emoji === emoji)
        if (existingReaction) {
          if (existingReaction.hasReacted) {
            return {
              ...msg,
              reactions: msg.reactions
                .map(r =>
                  r.emoji === emoji
                    ? { ...r, count: r.count - 1, hasReacted: false }
                    : r
                )
                .filter(r => r.count > 0),
            }
          } else {
            return {
              ...msg,
              reactions: msg.reactions.map(r =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, hasReacted: true }
                  : r
              ),
            }
          }
        } else {
          return {
            ...msg,
            reactions: [
              ...msg.reactions,
              { emoji, count: 1, users: [currentUser?.id || ''], hasReacted: true },
            ],
          }
        }
      })
    )
  }, [currentUser])

  // Handle starting a new DM
  const handleStartNewDM = useCallback(async (otherUserId: string) => {
    if (!currentUser || useMockData) {
      // In mock mode, just show the first DM conversation as a demo
      const dmConversation = conversations.find(c => c.type === 'dm')
      if (dmConversation) {
        handleSelectConversation(dmConversation)
      }
      return
    }

    try {
      const result = await startNewDM({
        userId: currentUser.id,
        otherUserId,
        orgId,
      })

      if (result.success && result.data) {
        // Refresh conversations to include the new one
        const convResult = await fetchUserConversations(currentUser.id, orgId)
        if (convResult.success && convResult.data) {
          // Find the new/existing conversation and select it
          const newConv = convResult.data.find((c: any) => c.id === result.data?.id)
          if (newConv) {
            // Convert to UI format
            const participants = (newConv.participants || []).map((p: any) =>
              dbUserToChatUser(p.profile ? {
                user_id: p.profile.user_id,
                full_name: p.profile.full_name,
                avatar_url: p.profile.avatar_url,
                job_title: p.profile.job_title,
                organization_name: p.profile.organization?.name || null,
              } : null)
            )

            const uiConv = dbConversationToConversation(
              newConv,
              participants,
              currentUser.id,
              newConv.unread_count || 0
            )

            // Update conversations list
            setConversations(prev => {
              const exists = prev.some(c => c.id === uiConv.id)
              if (exists) {
                return prev
              }
              return [...prev, uiConv]
            })

            // Select the new conversation
            handleSelectConversation(uiConv)
            setShowMobileChat(true)
          }
        }
      }
    } catch (err) {
      console.error("Error starting new DM:", err)
    }
  }, [currentUser, orgId, useMockData, conversations, handleSelectConversation])

  // Handle back button (mobile)
  const handleBack = useCallback(() => {
    setShowMobileChat(false)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SocialHeader />

      {/* Demo mode indicator */}
      {useMockData && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Demo Mode - Using sample data. Sign in to use real chat.
          </p>
        </div>
      )}

      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        {/* Conversation list */}
        <div
          className={cn(
            "w-full max-w-full flex-shrink-0 border-r border-border/50",
            "lg:w-80 lg:max-w-80",
            showMobileChat ? "hidden lg:block" : "block"
          )}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id || null}
            onSelectConversation={handleSelectConversation}
            currentUser={currentUser || mockCurrentUser}
            onNewDM={handleStartNewDM}
            orgId={orgId}
          />
        </div>

        {/* Chat view */}
        <div
          className={cn(
            "flex-1 min-w-0 overflow-hidden",
            !showMobileChat && !activeConversation ? "hidden lg:flex" : "flex"
          )}
        >
          {activeConversation ? (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <ChatView
                conversation={activeConversation}
                messages={messages}
                currentUser={currentUser || mockCurrentUser}
                onSendMessage={handleSendMessage}
                onReact={handleReact}
                onBack={handleBack}
                showBackButton={true}
                typingUsers={typingUsers}
              />
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to get initials from a name
function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center px-4"
      >
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Select a conversation
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Choose a channel or direct message from the sidebar to start chatting
          with your team.
        </p>
      </motion.div>
    </div>
  )
}
