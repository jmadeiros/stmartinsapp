"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ConversationList } from "./conversation-list"
import { ChatView } from "./chat-view"
import { SocialHeader } from "@/components/social/header"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare } from "lucide-react"
import {
  mockConversations,
  currentUser,
  mockUsers,
  getMessagesForConversation,
} from "./mock-data"
import type { Conversation, Message } from "./chat-types"

export function ChatPage() {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(
    mockConversations[0] // Default to #general
  )
  const [messages, setMessages] = useState<Message[]>(
    getMessagesForConversation(mockConversations[0].id)
  )
  const [showMobileChat, setShowMobileChat] = useState(false)

  // Simulate typing users for demo
  const [typingUsers, setTypingUsers] = useState(
    activeConversation?.id === "channel-general" ? [mockUsers[0]] : []
  )

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation)
    setMessages(getMessagesForConversation(conversation.id))
    setShowMobileChat(true)
    
    // Simulate different typing states for demo
    if (conversation.id === "channel-general") {
      setTypingUsers([mockUsers[0]])
    } else if (conversation.id === "dm-sarah") {
      setTypingUsers([mockUsers[0]])
    } else {
      setTypingUsers([])
    }
  }, [])

  const handleSendMessage = useCallback((content: string, mentions?: string[]) => {
    if (!activeConversation) return

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

    setMessages((prev) => [...prev, newMessage])
    
    // Clear typing indicator after sending
    setTypingUsers([])
    
    // Simulate reply after a delay (for demo)
    if (activeConversation.type === "dm") {
      setTimeout(() => {
        const otherUser = activeConversation.participants.find(
          (p) => p.id !== currentUser.id
        )
        if (otherUser) {
          setTypingUsers([otherUser])
        }
      }, 1000)
    }
  }, [activeConversation])

  const handleReact = useCallback((messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg

        const existingReaction = msg.reactions.find((r) => r.emoji === emoji)
        if (existingReaction) {
          // Toggle reaction
          if (existingReaction.hasReacted) {
            return {
              ...msg,
              reactions: msg.reactions
                .map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: r.count - 1, hasReacted: false }
                    : r
                )
                .filter((r) => r.count > 0),
            }
          } else {
            return {
              ...msg,
              reactions: msg.reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, hasReacted: true }
                  : r
              ),
            }
          }
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [
              ...msg.reactions,
              { emoji, count: 1, users: [currentUser.id], hasReacted: true },
            ],
          }
        }
      })
    )
  }, [])

  const handleBack = useCallback(() => {
    setShowMobileChat(false)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversation list - always visible on desktop, hidden on mobile when chat is open */}
      <div
        className={cn(
          "w-full lg:w-80 flex-shrink-0 border-r border-border/50",
          showMobileChat ? "hidden lg:block" : "block"
        )}
      >
        <ConversationList
          conversations={mockConversations}
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          currentUser={currentUser}
        />
      </div>

      {/* Chat view */}
      <div
        className={cn(
          "flex-1 min-w-0",
          !showMobileChat && !activeConversation ? "hidden lg:flex" : "flex"
        )}
      >
        {activeConversation ? (
          <div className="flex-1 flex flex-col">
            <ChatView
              conversation={activeConversation}
              messages={messages}
              currentUser={currentUser}
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



