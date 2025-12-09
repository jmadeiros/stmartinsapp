"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { MessageBubble } from "./message-bubble"
import { ChatInput } from "./chat-input"
import { ConversationHeader } from "./conversation-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { format, isToday, isYesterday, isSameDay } from "date-fns"
import type { Conversation, Message, ChatUser } from "./chat-types"

interface ChatViewProps {
  conversation: Conversation
  messages: Message[]
  currentUser: ChatUser
  onSendMessage: (content: string, mentions?: string[]) => void
  onReact: (messageId: string, emoji: string) => void
  onBack?: () => void
  showBackButton?: boolean
  typingUsers?: ChatUser[]
}

export function ChatView({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onReact,
  onBack,
  showBackButton = false,
  typingUsers = [],
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Group messages by sender and date
  const groupedMessages = messages.reduce<{
    date: Date
    groups: { sender: ChatUser; messages: Message[] }[]
  }[]>((acc, message) => {
    const messageDate = new Date(message.timestamp)
    
    // Find or create date group
    let dateGroup = acc.find((g) => isSameDay(g.date, messageDate))
    if (!dateGroup) {
      dateGroup = { date: messageDate, groups: [] }
      acc.push(dateGroup)
    }

    // Find or create sender group within date
    const lastGroup = dateGroup.groups[dateGroup.groups.length - 1]
    if (lastGroup && lastGroup.sender.id === message.sender.id) {
      // Same sender, add to group
      lastGroup.messages.push(message)
    } else {
      // Different sender, create new group
      dateGroup.groups.push({ sender: message.sender, messages: [message] })
    }

    return acc
  }, [])

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "EEEE, MMMM d")
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <ConversationHeader
        conversation={conversation}
        currentUser={currentUser}
        onBack={onBack}
        showBackButton={showBackButton}
      />

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="py-4">
          {groupedMessages.map((dateGroup, dateIndex) => (
            <div key={dateIndex}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-6">
                <div className="flex items-center gap-4 px-4">
                  <div className="h-px flex-1 bg-border/50 w-16" />
                  <span className="text-xs font-medium text-muted-foreground px-3 py-1 bg-muted/50 rounded-full">
                    {formatDateSeparator(dateGroup.date)}
                  </span>
                  <div className="h-px flex-1 bg-border/50 w-16" />
                </div>
              </div>

              {/* Message groups */}
              {dateGroup.groups.map((group, groupIndex) => (
                <div key={groupIndex} className="mb-2">
                  {group.messages.map((message, messageIndex) => {
                    const isOwn = message.sender.id === currentUser.id
                    const isFirstInGroup = messageIndex === 0
                    const isLastInGroup = messageIndex === group.messages.length - 1
                    const showAvatar = isLastInGroup

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        isFirstInGroup={isFirstInGroup}
                        isLastInGroup={isLastInGroup}
                        showAvatar={showAvatar}
                        onReact={onReact}
                        onReply={(msg) => setReplyingTo(msg)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 px-4 py-2"
              >
                <div className="flex -space-x-2">
                  {typingUsers.slice(0, 3).map((user) => (
                    <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-[10px]">{user.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="flex items-center gap-1 px-3 py-2 bg-muted/60 rounded-2xl">
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        users={conversation.participants.filter((p) => p.id !== currentUser.id)}
        placeholder={`Message ${conversation.type === "channel" ? `#${conversation.name}` : conversation.name}...`}
      />
    </div>
  )
}

// Animated typing dots
function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  )
}



