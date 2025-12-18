'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notifications'
import type { Notification } from '@/lib/collaboration.types'
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

      const result = await getNotifications(userId, { limit, unreadOnly })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch notifications')
      }

      return result.data as Notification[]
    },
    enabled: enabled && !!userId,
    // Stale-while-revalidate settings for instant feel
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: true, // Refetch when component mounts (background)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 60 * 1000, // Poll every 60 seconds for new notifications
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
