"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Hash, Users, Phone, Video, Info, Search, Pin, MoreVertical, ChevronLeft } from "lucide-react"
import type { Conversation, ChatUser } from "./chat-types"

interface ConversationHeaderProps {
  conversation: Conversation
  currentUser: ChatUser
  onBack?: () => void
  onInfoClick?: () => void
  showBackButton?: boolean
}

export function ConversationHeader({
  conversation,
  currentUser,
  onBack,
  onInfoClick,
  showBackButton = false,
}: ConversationHeaderProps) {
  const isChannel = conversation.type === "channel"
  const isGroup = conversation.type === "group"
  const isDM = conversation.type === "dm"

  const dmParticipant = isDM
    ? conversation.participants.find((p) => p.id !== currentUser.id)
    : undefined

  const onlineCount = conversation.participants.filter((p) => p.isOnline).length

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card">
      <div className="flex items-center gap-3 min-w-0">
        {showBackButton && (
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg lg:hidden" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {isChannel ? (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Hash className="h-5 w-5 text-primary" />
          </div>
        ) : isGroup ? (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
        ) : (
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={dmParticipant?.avatar} alt={dmParticipant?.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                {dmParticipant?.initials}
              </AvatarFallback>
            </Avatar>
            {dmParticipant?.isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
            )}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground truncate">
              {isChannel ? `#${conversation.name}` : conversation.name}
            </h2>
            {conversation.isPinned && <Pin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
          </div>
          
          {isChannel && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {onlineCount} online
              </span>
              <span className="mx-1">•</span>
              <span>{conversation.participants.length} members</span>
            </p>
          )}
          {isGroup && (
            <p className="text-xs text-muted-foreground truncate">
              {conversation.participants.map(p => p.name.split(' ')[0]).join(', ')}
            </p>
          )}
          {isDM && dmParticipant && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
              {dmParticipant.isOnline ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active now
                </span>
              ) : (
                <span>Last seen recently</span>
              )}
              <span className="mx-1">•</span>
              <span>{dmParticipant.organization}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hidden sm:flex">
          <Search className="h-4 w-4" />
        </Button>
        {isDM && (
          <>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hidden md:flex">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hidden md:flex">
              <Video className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground" onClick={onInfoClick}>
          <Info className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}



