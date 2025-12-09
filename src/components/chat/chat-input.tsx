"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Send, 
  Smile, 
  Paperclip, 
  Image as ImageIcon,
  AtSign,
  X,
  Mic
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ChatUser, Message } from "./chat-types"

interface ChatInputProps {
  onSend: (content: string, mentions?: string[]) => void
  replyingTo?: Message | null
  onCancelReply?: () => void
  users: ChatUser[]
  placeholder?: string
  disabled?: boolean
}

export function ChatInput({
  onSend,
  replyingTo,
  onCancelReply,
  users,
  placeholder = "Type a message...",
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionIndex, setMentionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  const quickEmojis = ["👍", "❤️", "😂", "🎉", "🙏", "👏", "🔥", "✅", "👀", "💯"]
  
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])

  // Handle @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Check for @ mentions
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Check if there's no space between @ and current position
      if (!textAfterAt.includes(" ")) {
        setMentionQuery(textAfterAt)
        setShowMentionPicker(true)
        setMentionIndex(0)
        return
      }
    }
    setShowMentionPicker(false)
  }

  // Handle keyboard navigation in mention picker
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length)
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        insertMention(filteredUsers[mentionIndex])
      } else if (e.key === "Escape") {
        setShowMentionPicker(false)
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertMention = (user: ChatUser) => {
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = message.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    const textAfterCursor = message.slice(cursorPos)
    
    const newMessage = 
      message.slice(0, lastAtIndex) + 
      `@${user.name} ` + 
      textAfterCursor

    setMessage(newMessage)
    setShowMentionPicker(false)
    textareaRef.current?.focus()
  }

  const insertEmoji = (emoji: string) => {
    const cursorPos = textareaRef.current?.selectionStart || message.length
    const newMessage = 
      message.slice(0, cursorPos) + 
      emoji + 
      message.slice(cursorPos)
    
    setMessage(newMessage)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const handleSend = () => {
    if (message.trim() && !disabled) {
      // Extract mentions from message
      const mentionRegex = /@(\w+\s\w+)/g
      const mentions: string[] = []
      let match
      while ((match = mentionRegex.exec(message)) !== null) {
        const mentionedUser = users.find(u => u.name === match[1])
        if (mentionedUser) {
          mentions.push(mentionedUser.id)
        }
      }
      
      onSend(message.trim(), mentions.length > 0 ? mentions : undefined)
      setMessage("")
    }
  }

  return (
    <div className="border-t border-border/50 bg-card p-4">
      {/* Reply preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border-l-2 border-primary">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">
                  Replying to {replyingTo.sender.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {replyingTo.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={onCancelReply}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="relative flex items-end gap-2">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Input container */}
        <div className="relative flex-1">
          {/* Mention picker */}
          <AnimatePresence>
            {showMentionPicker && filteredUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full mb-2 left-0 w-64 bg-card border rounded-xl shadow-lg overflow-hidden z-10"
              >
                <div className="p-2 border-b">
                  <p className="text-xs font-medium text-muted-foreground">
                    People
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredUsers.map((user, index) => (
                    <button
                      key={user.id}
                      onClick={() => insertMention(user)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                        index === mentionIndex ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-xs">
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.role} • {user.organization}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={emojiPickerRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full mb-2 right-0 bg-card border rounded-xl shadow-lg p-3 z-10"
              >
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Quick reactions
                </p>
                <div className="flex flex-wrap gap-1">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="h-9 w-9 flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text input */}
          <div className="flex items-end gap-2 bg-muted/50 rounded-2xl px-4 py-2 border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground min-h-[24px] max-h-[150px] py-0.5"
              style={{ height: "24px" }}
            />
            
            {/* Input actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setMessage(message + "@")
                  setShowMentionPicker(true)
                  setMentionQuery("")
                  textareaRef.current?.focus()
                }}
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Send button */}
        <Button
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full flex-shrink-0 transition-all",
            message.trim()
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground"
          )}
          onClick={handleSend}
          disabled={!message.trim() || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}



