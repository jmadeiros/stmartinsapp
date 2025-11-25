"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Bell, Clock, Handshake, Calendar, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getNotifications, markNotificationRead, respondToInvitation } from "@/lib/actions/collaboration"
import type { Notification } from "@/lib/collaboration.types"

interface NotificationsDropdownProps {
  userId?: string
  isOpen: boolean
  onClose: () => void
}

export function NotificationsDropdown({ userId, isOpen, onClose }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications()
    }
  }, [isOpen, userId])

  const fetchNotifications = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const result = await getNotifications(userId, false)
      if (result.success) {
        setNotifications(result.data as Notification[])
      }
    } catch (error) {
      console.error('[NotificationsDropdown] Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkRead = async (notificationId: string) => {
    await markNotificationRead(notificationId)
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
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
        // Mark notification as read and remove from list
        await markNotificationRead(notificationId)
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      } else {
        console.error('[NotificationsDropdown] Error responding:', result.error)
      }
    } catch (error) {
      console.error('[NotificationsDropdown] Exception:', error)
    } finally {
      setRespondingTo(null)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'collaboration_invitation':
        return <Handshake className="h-4 w-4 text-purple-600" />
      case 'collaboration_request':
        return <Handshake className="h-4 w-4 text-blue-600" />
      case 'invitation_accepted':
        return <Check className="h-4 w-4 text-green-600" />
      case 'invitation_declined':
        return <X className="h-4 w-4 text-red-600" />
      case 'event_reminder':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'project_update':
        return <Target className="h-4 w-4 text-emerald-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-96 z-50 rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 px-2 text-xs"
              >
                Close
              </Button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 transition-colors hover:bg-muted/50",
                        !notification.read && "bg-blue-50/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-foreground">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                            {notification.message}
                          </p>

                          {/* Action Buttons for Invitations */}
                          {notification.type === 'collaboration_invitation' && notification.action_data && (
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => handleRespondToInvitation(
                                  notification.id,
                                  notification.action_data?.invitation_id || '',
                                  'accepted'
                                )}
                                disabled={respondingTo === notification.action_data?.invitation_id}
                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRespondToInvitation(
                                  notification.id,
                                  notification.action_data?.invitation_id || '',
                                  'declined'
                                )}
                                disabled={respondingTo === notification.action_data?.invitation_id}
                                className="h-7 text-xs"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Decline
                              </Button>
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>

                          {/* Mark as read */}
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkRead(notification.id)}
                              className="text-[10px] text-primary hover:underline mt-1"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border px-4 py-2 bg-muted/30">
                <button className="text-xs text-primary hover:underline font-medium">
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
