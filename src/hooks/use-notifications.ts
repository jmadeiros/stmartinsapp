'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notifications'
import { subscribeToUserNotifications } from '@/lib/queries/notifications'
import type { Notification } from '@/lib/collaboration.types'
import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useRef } from 'react'

// Query keys for cache management
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, 'list', userId] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, 'unread-count', userId] as const,
}

interface UseNotificationsOptions {
  userId?: string
  enabled?: boolean
  limit?: number
  unreadOnly?: boolean
}

interface UseNotificationsResult {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isFetching: boolean
  isStale: boolean
  error: Error | null
  markAsRead: (notificationIds: string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  refetch: () => void
}

export function useNotifications({
  userId,
  enabled = true,
  limit = 50,
  unreadOnly = false,
}: UseNotificationsOptions): UseNotificationsResult {
  const queryClient = useQueryClient()
  const supabaseRef = useRef(createClient())

  // Main notifications query with stale-while-revalidate
  const {
    data,
    isLoading,
    isFetching,
    isStale,
    error,
    refetch,
  } = useQuery({
    queryKey: notificationKeys.list(userId || ''),
    queryFn: async () => {
      if (!userId) {
        return []
      }

      const supabase = supabaseRef.current
      const startedAt = typeof window !== 'undefined' ? window.performance.now() : Date.now()
      if (process.env.NODE_ENV !== 'production') {
        console.log('[useNotifications] Fetching notifications for user:', userId)
      }

      // Ensure we have a valid session (RLS requires authenticated role)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        throw new Error(sessionError.message)
      }
      if (!sessionData.session) {
        return []
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (unreadOnly) {
        query = query.eq('read', false)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data: rows, error: queryError } = await (query as any)

      if (queryError) {
        throw new Error(queryError.message || 'Failed to fetch notifications')
      }

      const notifications = (rows || []).map((row: any) => ({
        ...row,
        read: Boolean(row.read),
        created_at: row.created_at ?? new Date().toISOString(),
      })) as Notification[]

      if (process.env.NODE_ENV !== 'production') {
        const elapsedMs =
          typeof window !== 'undefined'
            ? Math.round(window.performance.now() - startedAt)
            : Date.now() - startedAt
        console.log('[useNotifications] Fetched notifications:', {
          count: notifications.length,
          elapsedMs,
        })
      }

      return notifications
    },
    enabled: enabled && !!userId,
    // Stale-while-revalidate settings for instant feel
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: true, // Refetch when component mounts (background)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 30 * 1000, // Poll every 30 seconds as fallback (realtime is primary)
    // Return stale data immediately while fetching fresh data
    placeholderData: (previousData) => previousData,
  })

  const notifications = data || []
  const unreadCount = notifications.filter((n) => !n.read).length

  // Track previous userId to detect when it becomes available
  const prevUserIdRef = useRef<string | undefined>(undefined)

  // Force refetch when userId changes from undefined to defined
  useEffect(() => {
    const prevUserId = prevUserIdRef.current
    prevUserIdRef.current = userId

    // If userId just became available (was undefined, now defined), force refetch
    if (!prevUserId && userId) {
      // Small delay to ensure React Query has updated its state
      setTimeout(() => {
        refetch()
      }, 100)
    }
  }, [userId, refetch])

  // Realtime subscription for instant notifications
  useEffect(() => {
    if (!userId) {
      console.log('[useNotifications] No userId, skipping realtime subscription')
      return
    }

    const supabase = supabaseRef.current
    let channelCleanup: (() => void) | undefined

    async function setupSubscription() {
      console.log('[useNotifications] Setting up realtime subscription for user:', userId)

      // Ensure the client has an authenticated session before subscribing
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('[useNotifications] Failed to load session for realtime:', sessionError)
        return
      }
      if (!sessionData.session) {
        console.warn('[useNotifications] No session available for realtime; skipping subscription')
        return
      }

      // Make sure realtime uses the user's access token (otherwise RLS will block events)
      supabase.realtime.setAuth(sessionData.session.access_token)

      const channel = subscribeToUserNotifications(
        supabase,
        userId!, // Guarded by the check at the start of useEffect
        // On INSERT - new notification arrived
        (newNotification) => {
          console.log('[useNotifications] Received new notification via realtime:', newNotification)
          if (newNotification.user_id !== userId) {
            console.warn('[useNotifications] Dropping realtime notification for different user', {
              expected: userId,
              received: newNotification.user_id,
            })
            return
          }
          queryClient.setQueryData<Notification[]>(
            notificationKeys.list(userId),
            (old) => old ? [newNotification, ...old] : [newNotification]
          )
        },
        // On UPDATE - notification changed (e.g., marked as read on another device)
        (updatedNotification) => {
          console.log('[useNotifications] Received notification update via realtime:', updatedNotification)
          if (updatedNotification.user_id !== userId) {
            console.warn('[useNotifications] Dropping realtime notification update for different user', {
              expected: userId,
              received: updatedNotification.user_id,
            })
            return
          }
          queryClient.setQueryData<Notification[]>(
            notificationKeys.list(userId),
            (old) => {
              if (!old) return old
              // Check if already in sync to prevent optimistic update flicker
              const existing = old.find(n => n.id === updatedNotification.id)
              if (existing?.read === updatedNotification.read) return old
              return old.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            }
          )
        }
      )

      channelCleanup = () => {
        console.log('[useNotifications] Cleaning up realtime subscription for user:', userId)
        channel.unsubscribe()
      }
    }

    setupSubscription()

    return () => {
      if (channelCleanup) {
        channelCleanup()
      }
    }
  }, [userId, queryClient])

  // Mutation for marking notifications as read
  const markReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      // Mark each notification as read
      await Promise.all(
        notificationIds.map((id) => markNotificationAsRead(id))
      )
    },
    // Optimistic update - update UI immediately before server confirms
    onMutate: async (notificationIds: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.list(userId || '') })

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        notificationKeys.list(userId || '')
      )

      // Optimistically update the cache
      queryClient.setQueryData<Notification[]>(
        notificationKeys.list(userId || ''),
        (old) =>
          old?.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          ) || []
      )

      return { previousNotifications }
    },
    // If mutation fails, rollback to previous value
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(userId || ''),
          context.previousNotifications
        )
      }
    },
    // Only refetch on success after a delay to ensure server has committed
    onSuccess: () => {
      // Delay the refetch to ensure server has committed the changes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId || '') })
      }, 1000)
    },
  })

  // Mutation for marking all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return
      await markAllNotificationsAsRead(userId)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list(userId || '') })

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        notificationKeys.list(userId || '')
      )

      // Optimistically mark all as read
      queryClient.setQueryData<Notification[]>(
        notificationKeys.list(userId || ''),
        (old) => old?.map((n) => ({ ...n, read: true })) || []
      )

      return { previousNotifications }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(userId || ''),
          context.previousNotifications
        )
      }
    },
    // Only refetch on success after a delay to ensure server has committed
    onSuccess: () => {
      // Delay the refetch to ensure server has committed the changes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId || '') })
      }, 1000)
    },
  })

  const markAsRead = useCallback(
    async (notificationIds: string[]) => {
      await markReadMutation.mutateAsync(notificationIds)
    },
    [markReadMutation]
  )

  const markAllAsRead = useCallback(async () => {
    await markAllReadMutation.mutateAsync()
  }, [markAllReadMutation])

  return {
    notifications,
    unreadCount,
    isLoading,
    isFetching,
    isStale,
    error: error as Error | null,
    markAsRead,
    markAllAsRead,
    refetch,
  }
}
