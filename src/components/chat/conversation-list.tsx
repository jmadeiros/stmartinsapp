"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Hash,
  Plus,
  ChevronDown,
  ChevronRight,
  Users,
  Pin,
  Volume2,
  VolumeX,
  MessageCirclePlus
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Conversation, ChatUser } from "./chat-types"
import { NewDMDialog } from "./new-dm-dialog"

interface ConversationListProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (conversation: Conversation) => void
  currentUser: ChatUser
  onNewDM?: (userId: string) => void
  orgId?: string
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  currentUser,
  onNewDM,
  orgId,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [channelsExpanded, setChannelsExpanded] = useState(true)
  const [dmsExpanded, setDmsExpanded] = useState(true)
  const [showNewDM, setShowNewDM] = useState(false)

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Separate channels and DMs
  const channels = filteredConversations.filter((c) => c.type === "channel")
  const directMessages = filteredConversations.filter((c) => c.type === "dm" || c.type === "group")

  // Get other participant for DM (not current user)
  const getDMParticipant = (conversation: Conversation): ChatUser | undefined => {
    if (conversation.type === "dm") {
      return conversation.participants.find((p) => p.id !== currentUser.id)
    }
    return undefined
  }

  const handleNewDMSelect = (user: ChatUser) => {
    if (onNewDM) {
      onNewDM(user.id)
    }
    setShowNewDM(false)
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setShowNewDM(true)}
            title="New message"
          >
            <MessageCirclePlus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Channels section */}
        <div className="mb-2">
          <button
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className="flex items-center gap-1 px-4 py-2 w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {channelsExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Channels
            <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">
              {channels.length}
            </span>
          </button>
          
          <AnimatePresence>
            {channelsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {channels.map((channel) => (
                  <ConversationItem
                    key={channel.id}
                    conversation={channel}
                    isActive={activeConversationId === channel.id}
                    onClick={() => onSelectConversation(channel)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direct Messages section */}
        <div>
          <button
            onClick={() => setDmsExpanded(!dmsExpanded)}
            className="flex items-center gap-1 px-4 py-2 w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {dmsExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Direct Messages
            <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">
              {directMessages.length}
            </span>
          </button>
          
          <AnimatePresence>
            {dmsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {directMessages.map((dm) => (
                  <ConversationItem
                    key={dm.id}
                    conversation={dm}
                    isActive={activeConversationId === dm.id}
                    onClick={() => onSelectConversation(dm)}
                    participant={getDMParticipant(dm)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New DM Dialog */}
      {orgId && (
        <NewDMDialog
          open={showNewDM}
          onOpenChange={setShowNewDM}
          onSelectUser={handleNewDMSelect}
          orgId={orgId}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  participant?: ChatUser
}

function ConversationItem({ conversation, isActive, onClick, participant }: ConversationItemProps) {
  const isChannel = conversation.type === "channel"
  const isGroup = conversation.type === "group"
  const hasUnread = conversation.unreadCount > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left",
        isActive
          ? "bg-primary/10 border-l-2 border-primary"
          : "hover:bg-muted/50 border-l-2 border-transparent",
        hasUnread && !isActive && "bg-muted/30"
      )}
    >
      {/* Icon/Avatar */}
      {isChannel ? (
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <Hash className="h-4 w-4" />
        </div>
      ) : isGroup ? (
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <Users className="h-4 w-4" />
        </div>
      ) : (
        <div className="relative flex-shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={participant?.avatar} alt={participant?.name} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
              {participant?.initials}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          {participant?.isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm truncate",
            hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground"
          )}>
            {isChannel ? `#${conversation.name}` : conversation.name}
          </span>
          {conversation.isPinned && (
            <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
          {conversation.isMuted && (
            <VolumeX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        {conversation.description && isChannel && (
          <p className="text-xs text-muted-foreground truncate">
            {conversation.description}
          </p>
        )}
        {!isChannel && participant && (
          <p className="text-xs text-muted-foreground truncate">
            {participant.organization}
          </p>
        )}
        {isGroup && (
          <p className="text-xs text-muted-foreground truncate">
            {conversation.participants.length} members
          </p>
        )}
      </div>

      {/* Unread badge */}
      {hasUnread && (
        <span className={cn(
          "flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-primary text-primary-foreground"
        )}>
          {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
        </span>
      )}
    </button>
  )
}



