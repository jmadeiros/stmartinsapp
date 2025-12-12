"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Heart, ExternalLink, Calendar, Target, Send, Trash2, Edit2 } from "lucide-react"
import { ContentBadge } from "@/components/ui/content-badge"
import { CategoryBadge } from "@/components/ui/category-badge"
import { PostMenu } from "@/components/ui/post-menu"
import { Textarea } from "@/components/ui/textarea"
import type { Post } from "@/lib/types"
import { getComments, addComment, deleteComment, type CommentWithAuthor } from "@/lib/actions/comments"
import { createClient } from "@/lib/supabase/client"
import { toggleReaction, getReactionData } from "@/lib/actions/reactions"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [commentCount, setCommentCount] = useState(post.comments || 0)
  const [newCommentText, setNewCommentText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Reaction states
  const [reactionCount, setReactionCount] = useState(post.likes || 0)
  const [hasReacted, setHasReacted] = useState(false)
  const [isLoadingReaction, setIsLoadingReaction] = useState(false)

  // Get current user
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id)
      }
    })
  }, [])

  // Fetch reaction data on mount
  useEffect(() => {
    async function fetchReactionData() {
      const { count, hasReacted: userReacted } = await getReactionData(post.id)
      setReactionCount(count)
      setHasReacted(userReacted)
    }
    fetchReactionData()
  }, [post.id])

  const loadComments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getComments(post.id)
    if (!error && data) {
      setComments(data)
      setCommentCount(data.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0))
    }
    setLoading(false)
  }, [post.id])

  // Load comments when expanded
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments()
    }
  }, [showComments, comments.length, loadComments])

  const handleAddComment = async () => {
    if (!newCommentText.trim()) return

    setLoading(true)
    const { success, data } = await addComment(post.id, newCommentText)
    if (success && data) {
      setNewCommentText("")
      await loadComments()
    }
    setLoading(false)
  }

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim()) return

    setLoading(true)
    const { success } = await addComment(post.id, replyText, parentId)
    if (success) {
      setReplyText("")
      setReplyingTo(null)
      await loadComments()
    }
    setLoading(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    setLoading(true)
    const { success } = await deleteComment(commentId)
    if (success) {
      await loadComments()
    }
    setLoading(false)
  }

  // Handle reaction toggle
  const handleReactionToggle = async () => {
    if (isLoadingReaction) return

    setIsLoadingReaction(true)
    try {
      const result = await toggleReaction(post.id)

      if (result.success) {
        // Optimistically update UI
        setHasReacted(result.hasReacted)
        setReactionCount(prev => result.hasReacted ? prev + 1 : prev - 1)
      } else {
        console.error('Failed to toggle reaction:', result.error)
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
    } finally {
      setIsLoadingReaction(false)
    }
  }

  // Determine CTA based on linked content
  const getCTA = () => {
    if (post.linkedEventId) {
      return {
        text: "View Event",
        icon: Calendar,
        onClick: () => {
          console.log("Navigate to event:", post.linkedEventId)
          // TODO: Implement navigation to event
        }
      }
    }
    if (post.linkedProjectId) {
      return {
        text: "View Project",
        icon: Target,
        onClick: () => {
          console.log("Navigate to project:", post.linkedProjectId)
          // TODO: Implement navigation to project
        }
      }
    }
    return null
  }

  const cta = getCTA()

  return (
    <Card className="text-card-foreground flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-md transition-shadow hover:shadow-lg">
      <div className="p-4">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                {post.author.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">
                {post.author.role && post.author.organization 
                  ? `${post.author.role} at ${post.author.organization}`
                  : post.author.organization || post.author.handle
                } · {post.timeAgo}
              </p>
            </div>
          </div>
          <PostMenu
            contentType="post"
            isAuthor={false}
            onEdit={() => console.log("Edit post")}
            onShare={() => console.log("Share post")}
            onReport={() => console.log("Report post")}
            onLinkToEvent={() => console.log("Link to event")}
            onLinkToProject={() => console.log("Link to project")}
          />
        </div>

        {/* Badges - Category and Cause */}
        {(post.category || post.cause) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.category && <CategoryBadge category={post.category} />}
            {/* Only show cause for learnings - other categories won't have that option */}
            {post.cause && post.category === 'learnings' && (
              <ContentBadge type="cause" label={post.cause} />
            )}
          </div>
        )}

        {/* Title (optional) */}
        {post.title && (
          <h2 className="mb-2 text-lg font-bold text-foreground tracking-tight">{post.title}</h2>
        )}

        {/* Content */}
        <p className="mb-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>

        {/* Linked Content Indicator */}
        {(post.linkedEventId || post.linkedProjectId) && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {post.linkedEventId ? "About:" : "About:"}
              </span>
              <span className="font-medium text-foreground">
                {/* TODO: Show actual linked item name */}
                {post.linkedEventId ? "Linked Event" : "Linked Project"}
              </span>
            </div>
          </div>
        )}

        {/* Image (if attached) */}
        {post.image && (
          <div className="mb-4 overflow-hidden rounded-xl">
            <img src={post.image} alt={post.title || "Post image"} className="h-[150px] sm:h-[200px] w-full object-cover" />
          </div>
        )}

        {/* Footer - Engagement & CTA */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReactionToggle}
              disabled={isLoadingReaction}
              className="flex items-center gap-1.5 px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Heart
                className={`h-5 w-5 transition-all duration-200 ${
                  hasReacted
                    ? 'fill-rose-500 text-rose-500 scale-110'
                    : 'hover:scale-110'
                } ${isLoadingReaction ? 'animate-pulse' : ''}`}
              />
              <span className={`text-sm tabular-nums ${hasReacted ? 'text-rose-500 font-medium' : ''}`}>
                {reactionCount}
              </span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{commentCount}</span>
            </Button>
          </div>

          {/* Conditional CTA */}
          {cta && (
            <Button
              size="sm"
              variant="outline"
              onClick={cta.onClick}
              className="gap-2"
            >
              <cta.icon className="h-3.5 w-3.5" />
              {cta.text}
            </Button>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Comment Input */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">You</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="min-h-[40px] resize-none text-sm"
                disabled={loading}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={loading || !newCommentText.trim()}
                  className="gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  Comment
                </Button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          {loading && comments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onDelete={handleDeleteComment}
                  onReply={(commentId) => setReplyingTo(commentId)}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  handleAddReply={handleAddReply}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// Comment Item Component
interface CommentItemProps {
  comment: CommentWithAuthor
  currentUserId: string | null
  onDelete: (commentId: string) => void
  onReply: (commentId: string) => void
  replyingTo: string | null
  replyText: string
  setReplyText: (text: string) => void
  handleAddReply: (parentId: string) => void
  loading: boolean
  isReply?: boolean
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onReply,
  replyingTo,
  replyText,
  setReplyText,
  handleAddReply,
  loading,
  isReply = false
}: CommentItemProps) {
  const isAuthor = currentUserId === comment.author_id
  const showReplyForm = replyingTo === comment.id

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks}w ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={isReply ? "ml-12" : ""}>
      <div className="flex gap-3 group">
        <Avatar className="h-8 w-8 ring-2 ring-primary/10">
          <AvatarImage src={comment.author.avatar_url || "/placeholder.svg"} alt={comment.author.full_name} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-xs">
            {comment.author.full_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {comment.author.full_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(comment.created_at)}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 px-3">
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onReply(comment.id)}
              >
                Reply
              </Button>
            )}
            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-2 ml-3 flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[40px] resize-none text-sm"
                disabled={loading}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddReply(comment.id)}
                  disabled={loading || !replyText.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReply("")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onReply={onReply}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleAddReply={handleAddReply}
              loading={loading}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}


