"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Smile, Reply, MoreHorizontal, Check, CheckCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Message } from "./chat-types"
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  isFirstInGroup: boolean
  isLastInGroup: boolean
  showAvatar: boolean
  onReact?: (messageId: string, emoji: string) => void
  onReply?: (message: Message) => void
  currentUserId?: string
}

export function MessageBubble({
  message,
  isOwn,
  isFirstInGroup,
  isLastInGroup,
  showAvatar,
  onReact,
  onReply,
  currentUserId,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉"]

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "h:mm a")
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, "h:mm a")}`
    }
    return format(date, "MMM d, h:mm a")
  }

  // Check if current user is mentioned in this message
  const isCurrentUserMentioned = currentUserId && message.mentions?.includes(currentUserId)

  // Parse mentions in content
  const renderContent = (content: string) => {
    const mentionRegex = /@(\w+(?:\s+\w+)?)/g
    const parts = content.split(mentionRegex)

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // Check if this mention refers to the current user
        const isSelfMention = isCurrentUserMentioned && part.toLowerCase().includes(
          message.mentions?.find(m => m === currentUserId) ? part.toLowerCase() : ''
        )

        return (
          <span
            key={index}
            className={cn(
              "font-medium cursor-pointer hover:underline",
              isSelfMention
                ? "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1 rounded"
                : "text-primary"
            )}
          >
            @{part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex gap-2 px-4",
        isOwn ? "flex-row-reverse" : "flex-row",
        isFirstInGroup ? "mt-4" : "mt-0.5",
        // Highlight messages that mention the current user
        isCurrentUserMentioned && !isOwn && "bg-amber-50/50 dark:bg-amber-950/20 -mx-4 px-8 py-1"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false)
        setShowEmojiPicker(false)
      }}
    >
      {/* Avatar */}
      <div className="w-8 flex-shrink-0">
        {showAvatar && !isOwn && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
              {message.sender.initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Message content */}
      <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {/* Sender name (first message in group, not own) */}
        {isFirstInGroup && !isOwn && (
          <span className="text-xs font-medium text-muted-foreground mb-1 px-3">
            {message.sender.name}
          </span>
        )}

        {/* Bubble */}
        <div className="relative flex items-end gap-2">
          {/* Action buttons (shown on hover) */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "flex items-center gap-0.5 absolute top-1/2 -translate-y-1/2",
                  isOwn ? "right-full mr-2" : "left-full ml-2"
                )}
              >
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-muted"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  
                  {/* Quick emoji picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -5 }}
                        className={cn(
                          "absolute bottom-full mb-1 flex gap-0.5 p-1.5 bg-card border rounded-full shadow-lg",
                          isOwn ? "right-0" : "left-0"
                        )}
                      >
                        {quickEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onReact?.(message.id, emoji)
                              setShowEmojiPicker(false)
                            }}
                            className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors text-base"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-muted"
                  onClick={() => onReply?.(message)}
                >
                  <Reply className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bubble content */}
          <div
            className={cn(
              "px-4 py-2.5 text-sm leading-relaxed",
              isOwn
                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                : "bg-muted/60 text-foreground rounded-2xl rounded-bl-md",
              // Adjust corners based on position in group
              isFirstInGroup && isOwn && "rounded-tr-2xl",
              isFirstInGroup && !isOwn && "rounded-tl-2xl",
              !isFirstInGroup && isOwn && "rounded-tr-lg",
              !isFirstInGroup && !isOwn && "rounded-tl-lg",
              isLastInGroup && isOwn && "rounded-br-md",
              isLastInGroup && !isOwn && "rounded-bl-md",
              !isLastInGroup && isOwn && "rounded-br-lg",
              !isLastInGroup && !isOwn && "rounded-bl-lg"
            )}
          >
            <p className="whitespace-pre-wrap break-words">{renderContent(message.content)}</p>
          </div>
        </div>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
            {message.reactions.map((reaction, index) => (
              <button
                key={`${reaction.emoji}-${index}`}
                onClick={() => onReact?.(message.id, reaction.emoji)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                  reaction.hasReacted
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-muted hover:bg-muted/80 border border-transparent"
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp and read status (last message in group) */}
        {isLastInGroup && (
          <div className={cn(
            "flex items-center gap-1 mt-1 px-1",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}>
            <span className="text-[10px] text-muted-foreground">
              {formatMessageTime(message.timestamp)}
            </span>
            {isOwn && (
              <CheckCheck className="h-3 w-3 text-primary" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}



