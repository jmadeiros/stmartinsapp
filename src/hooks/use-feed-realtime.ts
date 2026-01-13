'use client'

import { useQueryClient } from '@tanstack/react-query'
import { subscribeToFeed, PostRow, PostCommentRow, PostReactionRow } from '@/lib/queries/feed'
import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useRef } from 'react'
import type { FeedItem, FeedPost } from '@/lib/types'

// Query keys for cache management
export const feedKeys = {
  all: ['feed'] as const,
  list: (orgId?: string) => [...feedKeys.all, 'list', orgId || 'all'] as const,
  item: (orgId: string | undefined, itemId: string) => [...feedKeys.all, 'item', orgId || 'all', itemId] as const,
}

interface UseFeedRealtimeOptions {
  orgId?: string
  enabled?: boolean
  onNewPost?: (post: PostRow) => void
  onPostUpdate?: (post: PostRow) => void
  onPostDelete?: (postId: string) => void
}

interface UseFeedRealtimeResult {
  isConnected: boolean
}

/**
 * Hook to subscribe to real-time feed updates
 *
 * This hook:
 * 1. Subscribes to INSERT/UPDATE/DELETE on posts table filtered by org_id
 * 2. Updates React Query cache on realtime events
 * 3. Handles cleanup on unmount
 *
 * Usage:
 * ```tsx
 * const { isConnected } = useFeedRealtime({
 *   orgId: currentOrgId,
 *   enabled: true,
 *   onNewPost: (post) => console.log('New post:', post),
 * })
 * ```
 */
export function useFeedRealtime({
  orgId,
  enabled = true,
  onNewPost,
  onPostUpdate,
  onPostDelete,
}: UseFeedRealtimeOptions): UseFeedRealtimeResult {
  const queryClient = useQueryClient()
  const supabaseRef = useRef(createClient())
  const isConnectedRef = useRef(false)

  // Convert database row to FeedItem format
  const convertPostRowToFeedItem = useCallback((row: PostRow): FeedPost => {
    return {
      id: row.id,
      type: 'post',
      author: {
        name: 'Unknown', // Will be populated by full query
        handle: '',
        avatar: '/placeholder.svg',
      },
      content: row.content || '',
      category: row.category as FeedPost['category'],
      linkedEventId: row.linked_event_id || undefined,
      linkedProjectId: row.linked_project_id || undefined,
      timeAgo: 'just now',
      createdAt: row.created_at || new Date().toISOString(),
      likes: 0, // Will be populated by full query
      comments: 0,
      isPinned: row.is_pinned || false,
      pinnedAt: row.pinned_at || undefined,
      pinnedBy: row.pinned_by || undefined,
    }
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (!enabled) {
      console.log('[useFeedRealtime] Skipping subscription - disabled')
      return
    }

    const supabase = supabaseRef.current
    let channelCleanup: (() => void) | undefined

    async function setupSubscription() {
      console.log('[useFeedRealtime] Setting up realtime subscription:', orgId || 'all orgs')

      // Ensure the client has an authenticated session before subscribing
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('[useFeedRealtime] Failed to load session for realtime:', sessionError)
        return
      }
      if (!sessionData.session) {
        console.warn('[useFeedRealtime] No session available for realtime; skipping subscription')
        return
      }

      // Make sure realtime uses the user's access token (otherwise RLS will block events)
      supabase.realtime.setAuth(sessionData.session.access_token)

      // Subscribe to feed - pass undefined for cross-org visibility
      const channel = subscribeToFeed(
        supabase,
        orgId, // Can be undefined for all orgs
        {
          // On INSERT - new post arrived
          onPostInsert: (newPost) => {
            console.log('[useFeedRealtime] Received new post via realtime:', newPost)

            // Update query cache by adding new post to the beginning
            queryClient.setQueryData<FeedItem[]>(
              feedKeys.list(orgId),
              (old) => {
                if (!old) return old
                const feedItem = convertPostRowToFeedItem(newPost)
                // Check if post already exists
                if (old.some(item => item.id === newPost.id)) {
                  return old
                }
                return [feedItem, ...old]
              }
            )

            // Call external callback if provided
            onNewPost?.(newPost)

            // Invalidate queries to fetch full data with author info
            queryClient.invalidateQueries({ queryKey: feedKeys.list(orgId) })
          },

          // On UPDATE - post changed (e.g., edited, pinned)
          onPostUpdate: (updatedPost) => {
            console.log('[useFeedRealtime] Received post update via realtime:', updatedPost)

            queryClient.setQueryData<FeedItem[]>(
              feedKeys.list(orgId),
              (old) => {
                if (!old) return old
                return old.map(item => {
                  if (item.id === updatedPost.id && item.type === 'post') {
                    return {
                      ...item,
                      content: updatedPost.content || item.content,
                      isPinned: updatedPost.is_pinned || false,
                      pinnedAt: updatedPost.pinned_at || undefined,
                      pinnedBy: updatedPost.pinned_by || undefined,
                    }
                  }
                  return item
                })
              }
            )

            onPostUpdate?.(updatedPost)
          },

          // On DELETE - post removed
          onPostDelete: (deletedPost) => {
            console.log('[useFeedRealtime] Received post delete via realtime:', deletedPost)

            queryClient.setQueryData<FeedItem[]>(
              feedKeys.list(orgId),
              (old) => {
                if (!old) return old
                return old.filter(item => item.id !== deletedPost.id)
              }
            )

            onPostDelete?.(deletedPost.id)
          },

          // On comment INSERT - increment comment count
          onCommentInsert: (newComment) => {
            console.log('[useFeedRealtime] Received new comment via realtime:', newComment)

            queryClient.setQueryData<FeedItem[]>(
              feedKeys.list(orgId),
              (old) => {
                if (!old) return old
                return old.map(item => {
                  if (item.id === newComment.post_id && item.type === 'post') {
                    return {
                      ...item,
                      comments: (item.comments || 0) + 1,
                    }
                  }
                  return item
                })
              }
            )
          },

          // On comment DELETE - decrement comment count
          onCommentDelete: (deletedComment) => {
            console.log('[useFeedRealtime] Received comment delete via realtime:', deletedComment)

            queryClient.setQueryData<FeedItem[]>(
              feedKeys.list(orgId),
              (old) => {
                if (!old) return old
                return old.map(item => {
                  if (item.id === deletedComment.post_id && item.type === 'post') {
                    return {
                      ...item,
                      comments: Math.max((item.comments || 0) - 1, 0),
                    }
                  }
                  return item
                })
              }
            )
          },

          // On reaction INSERT - increment like count
          onReactionInsert: (newReaction) => {
            console.log('[useFeedRealtime] Received new reaction via realtime:', newReaction)

            queryClient.setQueryData<FeedItem[]>(
              feedKeys.list(orgId),
              (old) => {
                if (!old) return old
                return old.map(item => {
                  if (item.id === newReaction.post_id && item.type === 'post') {
                    return {
                      ...item,
                      likes: (item.likes || 0) + 1,
                    }
                  }
                  return item
                })
              }
            )
          },

          // On reaction DELETE - decrement like count
          onReactionDelete: (deletedReaction) => {
            console.log('[useFeedRealtime] Received reaction delete via realtime:', deletedReaction)

            queryClient.setQueryData<FeedItem[]>(
              feedKeys.list(orgId),
              (old) => {
                if (!old) return old
                return old.map(item => {
                  if (item.id === deletedReaction.post_id && item.type === 'post') {
                    return {
                      ...item,
                      likes: Math.max((item.likes || 0) - 1, 0),
                    }
                  }
                  return item
                })
              }
            )
          },
        }
      )

      isConnectedRef.current = true

      channelCleanup = () => {
        console.log('[useFeedRealtime] Cleaning up realtime subscription:', orgId || 'all orgs')
        isConnectedRef.current = false
        channel.unsubscribe()
      }
    }

    setupSubscription()

    return () => {
      if (channelCleanup) {
        channelCleanup()
      }
    }
  }, [orgId, enabled, queryClient, convertPostRowToFeedItem, onNewPost, onPostUpdate, onPostDelete])

  return {
    isConnected: isConnectedRef.current,
  }
}
