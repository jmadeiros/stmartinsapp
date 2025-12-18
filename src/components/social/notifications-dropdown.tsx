"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Bell, Clock, Handshake, Calendar, Target, Heart, MessageCircle, AtSign, Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { respondToInvitation } from "@/lib/actions/collaboration"
import { useNotifications } from "@/hooks/use-notifications"
import type { Notification } from "@/lib/collaboration.types"

// Extended notification type to include any additional fields
type NotificationWithLink = Notification

interface NotificationsDropdownProps {
  userId?: string
  isOpen: boolean
  onClose: () => void
  onCountChange?: (count: number) => void
}

// Grouped notification type
interface GroupedNotification {
  id: string
  type: Notification['type']
  referenceId: string | null
  actors: string[]
  actorCount: number
  latestNotification: NotificationWithLink
  allNotifications: NotificationWithLink[]
  hasUnread: boolean
  commentPreview?: string
  postPreview?: string
  eventTitle?: string
  projectTitle?: string
  link?: string | null
}

export function NotificationsDropdown({ userId, isOpen, onClose, onCountChange }: NotificationsDropdownProps) {
  const router = useRouter()
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [position, setPosition] = useState({ top: 0, right: 0 })

  // Use React Query for cached, stale-while-revalidate notifications
  const {
    notifications,
    unreadCount,
    isLoading,
    isFetching,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    userId,
    enabled: !!userId,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync unread count with header
  useEffect(() => {
    onCountChange?.(unreadCount)
  }, [unreadCount, onCountChange])

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        const bellButton = document.querySelector('[data-notification-bell]') as HTMLElement
        
        if (bellButton) {
          buttonRef.current = bellButton as any
          const rect = bellButton.getBoundingClientRect()
          const newPosition = {
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
          }
          setPosition(newPosition)
        } else {
          const header = document.querySelector('header') as HTMLElement
          if (header) {
            const headerRect = header.getBoundingClientRect()
            const newPosition = {
              top: headerRect.bottom + 8,
              right: 16
            }
            setPosition(newPosition)
          }
        }
      })
    }
  }, [isOpen])

  // Handler for marking all as read - uses hook's optimistic mutation
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    await markAllAsRead()
  }

  // Group notifications by type + reference_id (like FB/Instagram)
  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, GroupedNotification>()

    notifications.forEach((notification) => {
      // Key for grouping: type + reference_id
      // For reactions, group all likes on the same post
      // For comments, show individually with preview
      const isGroupable = notification.type === 'reaction'
      // Use reference_id from database (legacy field name is resource_id in types)
      const referenceId = (notification as any).reference_id || notification.resource_id
      const groupKey = isGroupable
        ? `${notification.type}-${referenceId}`
        : notification.id // Individual key for non-groupable
      
      if (groups.has(groupKey)) {
        const existing = groups.get(groupKey)!
        const actorName = (notification as any).action_data?.actor_name || notification.title.split(' ')[0]
        if (!existing.actors.includes(actorName)) {
          existing.actors.push(actorName)
        }
        existing.actorCount++
        existing.allNotifications.push(notification)
        if (!notification.read) {
          existing.hasUnread = true
        }
        // Keep the latest notification
        if (new Date(notification.created_at) > new Date(existing.latestNotification.created_at)) {
          existing.latestNotification = notification
        }
      } else {
        const actorName = (notification as any).action_data?.actor_name || notification.title.split(' ')[0]
        const actionData = (notification as any).action_data || {}
        const notifWithLink = notification as NotificationWithLink
        groups.set(groupKey, {
          id: groupKey,
          type: notification.type,
          referenceId: referenceId,
          actors: [actorName],
          actorCount: 1,
          latestNotification: notifWithLink,
          allNotifications: [notifWithLink],
          hasUnread: !notification.read,
          commentPreview: actionData.comment_preview || notification.message,
          postPreview: actionData.post_preview,
          eventTitle: actionData.event_title,
          projectTitle: actionData.project_title,
          link: notifWithLink.link
        })
      }
    })

    // Convert to array and sort by latest notification time
    return Array.from(groups.values())
      .sort((a, b) => new Date(b.latestNotification.created_at).getTime() - new Date(a.latestNotification.created_at).getTime())
  }, [notifications])

  // Handler for marking specific notifications as read - uses hook's optimistic mutation
  const handleMarkRead = async (notificationIds: string[]) => {
    await markAsRead(notificationIds)
  }

  // Handler for clicking a notification - marks as read, closes dropdown, and navigates
  const handleNotificationClick = async (group: GroupedNotification) => {
    // Mark all unread notifications in this group as read
    const unreadIds = group.allNotifications
      .filter(n => !n.read)
      .map(n => n.id)

    if (unreadIds.length > 0) {
      await handleMarkRead(unreadIds)
    }

    // Close the dropdown
    onClose()

    // Navigate to the link if available
    const navigationLink = group.link || group.latestNotification.link
    if (navigationLink) {
      // Use router.push for client-side navigation (smooth, no page reload)
      router.push(navigationLink)
    }
  }

  const handleRespondToInvitation = async (
    notificationId: string,
    invitationId: string,
    status: 'accepted' | 'declined'
  ) => {
    if (!userId) return

    setRespondingTo(invitationId)
    try {
      const result = await respondToInvitation({
        invitationId,
        status,
        respondedBy: userId,
      })

      if (result.success) {
        // Mark as read using the hook's optimistic mutation
        await markAsRead([notificationId])
      }
    } finally {
      setRespondingTo(null)
    }
  }

  const getNotificationIcon = (type: Notification['type'], isGrouped: boolean = false) => {
    const iconClass = isGrouped ? "h-5 w-5" : "h-4 w-4"
    switch (type) {
      case 'reaction':
        return <Heart className={cn(iconClass, "text-red-500 fill-red-500")} />
      case 'comment':
      case 'reply':
        return <MessageCircle className={cn(iconClass, "text-blue-500")} />
      case 'mention':
        return <AtSign className={cn(iconClass, "text-purple-500")} />
      case 'collaboration_invitation':
        return <Handshake className={cn(iconClass, "text-purple-600")} />
      case 'collaboration_request':
        return <Handshake className={cn(iconClass, "text-blue-600")} />
      case 'invitation_accepted':
        return <Check className={cn(iconClass, "text-green-600")} />
      case 'invitation_declined':
        return <X className={cn(iconClass, "text-red-600")} />
      case 'event_reminder':
      case 'rsvp':
        return <Calendar className={cn(iconClass, "text-blue-600")} />
      case 'project_update':
      case 'project_interest':
        return <Target className={cn(iconClass, "text-emerald-600")} />
      default:
        return <Bell className={cn(iconClass, "text-gray-600")} />
    }
  }

  const formatActors = (actors: string[], count: number): string => {
    if (count === 1) {
      return actors[0]
    } else if (count === 2) {
      return `${actors[0]} and ${actors[1]}`
    } else {
      return `${actors[0]} and ${count - 1} others`
    }
  }

  const getGroupedTitle = (group: GroupedNotification): string => {
    const actorsText = formatActors(group.actors, group.actorCount)

    switch (group.type) {
      case 'reaction':
        return `${actorsText} liked your post`
      case 'comment':
        return `${actorsText} commented on your post`
      case 'reply':
        return `${actorsText} replied to your comment`
      case 'mention':
        return `${actorsText} mentioned you`
      case 'rsvp':
        return `${actorsText} is attending your event`
      case 'project_interest':
        return `${actorsText} is interested in your project`
      default:
        return group.latestNotification.title
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!mounted) return null

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - z-40 so dropdown content (z-50) is clickable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          {/* Dropdown - z-50 to be above backdrop */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed w-[400px] z-50 rounded-2xl border border-border/50 bg-white/95 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] overflow-hidden"
            style={{
              top: `${position.top}px`,
              right: `${position.right}px`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center relative">
                  <Bell className="h-4 w-4 text-primary" />
                  {/* Subtle refresh indicator when fetching in background */}
                  {isFetching && !isLoading && (
                    <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary/80 animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-none">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="h-7 px-2 text-xs text-primary hover:bg-primary/5 rounded-full"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-7 px-2 text-xs hover:bg-black/5 rounded-full"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {isLoading && notifications.length === 0 ? (
                // Skeleton loading state - only show when no cached data
                <div className="divide-y divide-border/30">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted/60" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted/60 rounded w-3/4" />
                          <div className="h-3 bg-muted/40 rounded w-1/2" />
                        </div>
                        <div className="h-3 bg-muted/40 rounded w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : groupedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No new notifications for now</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {groupedNotifications.map((group) => (
                    <div
                      key={group.id}
                      className={cn(
                        "group relative p-4 transition-all hover:bg-muted/30 cursor-pointer",
                        group.hasUnread && "bg-primary/[0.03]"
                      )}
                      onClick={() => handleNotificationClick(group)}
                    >
                      {group.hasUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60 rounded-r" />
                      )}
                      
                      <div className="flex items-start gap-3">
                        {/* Icon with background */}
                        <div className="shrink-0 mt-0.5">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center shadow-sm border border-border/30",
                            group.hasUnread ? "bg-white" : "bg-muted/20",
                            group.actorCount > 1 && "relative"
                          )}>
                            {getNotificationIcon(group.type, true)}
                            {group.actorCount > 1 && (
                              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center border-2 border-white shadow-sm">
                                {group.actorCount > 9 ? '9+' : group.actorCount}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {/* Title with actors */}
                              <p className={cn(
                                "text-sm text-foreground leading-snug",
                                group.hasUnread ? "font-semibold" : "font-medium"
                              )}>
                                <span className="font-bold">{formatActors(group.actors, group.actorCount)}</span>
                                {' '}
                                <span className="text-muted-foreground">
                                  {group.type === 'reaction' && 'liked your post'}
                                  {group.type === 'comment' && 'commented on your post'}
                                  {group.type === 'reply' && 'replied to your comment'}
                                  {group.type === 'mention' && 'mentioned you'}
                                  {group.type === 'rsvp' && 'is attending your event'}
                                  {group.type === 'project_interest' && 'is interested in your project'}
                                  {!['reaction', 'comment', 'reply', 'mention', 'rsvp', 'project_interest'].includes(group.type) && group.latestNotification.title.replace(/^\w+\s/, '')}
                                </span>
                              </p>
                              
                              {/* Comment/reply preview - shows the comment text */}
                              {(group.type === 'comment' || group.type === 'reply') && group.commentPreview && (
                                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 bg-muted/30 rounded px-2 py-1">
                                  {group.commentPreview}
                                </p>
                              )}

                              {/* Post preview for reactions and mentions */}
                              {(group.type === 'reaction' || group.type === 'mention') && group.postPreview && (
                                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 bg-muted/30 rounded px-2 py-1">
                                  {group.postPreview}
                                </p>
                              )}

                              {/* Event title for RSVPs */}
                              {group.type === 'rsvp' && group.eventTitle && (
                                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {group.eventTitle}
                                </p>
                              )}

                              {/* Project title for project interest */}
                              {group.type === 'project_interest' && group.projectTitle && (
                                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {group.projectTitle}
                                </p>
                              )}
                            </div>
                            
                            {/* Time */}
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5 font-medium">
                              {formatTimeAgo(group.latestNotification.created_at)}
                            </span>
                          </div>

                          {/* Action Buttons for Invitations */}
                          {group.type === 'collaboration_invitation' && group.latestNotification.action_data && (
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRespondToInvitation(
                                    group.latestNotification.id,
                                    group.latestNotification.action_data?.invitation_id || '',
                                    'accepted'
                                  )
                                }}
                                disabled={respondingTo === group.latestNotification.action_data?.invitation_id}
                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-full px-4"
                              >
                                <Check className="h-3 w-3 mr-1.5" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRespondToInvitation(
                                    group.latestNotification.id,
                                    group.latestNotification.action_data?.invitation_id || '',
                                    'declined'
                                  )
                                }}
                                disabled={respondingTo === group.latestNotification.action_data?.invitation_id}
                                className="h-7 text-xs rounded-full px-4"
                              >
                                <X className="h-3 w-3 mr-1.5" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {groupedNotifications.length > 0 && (
              <div className="border-t border-border/50 p-2 bg-muted/30 backdrop-blur-sm">
                <Button 
                  variant="ghost" 
                  className="w-full h-9 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80"
                >
                  View all notifications
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(dropdownContent, document.body)
}
