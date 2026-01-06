"use client"

import { useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Send, CornerDownRight, MoreHorizontal, Trash2, Pencil, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { getEventComments, addEventComment, deleteEventComment, updateEventComment } from "@/lib/actions/event-comments"
import { getProjectComments, addProjectComment, deleteProjectComment, updateProjectComment } from "@/lib/actions/project-comments"

// Unified comment type for the component
type CommentWithAuthor = {
  id: string
  content: string
  author_id: string
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  parent_comment_id: string | null
  author: {
    user_id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    organization_id: string | null
  }
  replies?: CommentWithAuthor[]
}

interface CommentSectionProps {
  resourceType: 'event' | 'project'
  resourceId: string
  currentUserId: string
  initialComments?: CommentWithAuthor[]
}

export function CommentSection({
  resourceType,
  resourceId,
  currentUserId,
  initialComments = []
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Fetch comments
  const fetchComments = async () => {
    const result = resourceType === 'event'
      ? await getEventComments(resourceId)
      : await getProjectComments(resourceId)

    if (result.data) {
      setComments(result.data)
    }
  }

  // Add new comment
  const handleAddComment = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const result = resourceType === 'event'
        ? await addEventComment(resourceId, content, parentId)
        : await addProjectComment(resourceId, content, parentId)

      if (result.success && result.data) {
        if (parentId) {
          // Add reply to parent
          setComments(prev => addReplyToComment(prev, parentId, result.data!))
          setReplyingTo(null)
          setReplyContent("")
        } else {
          // Add top-level comment
          setComments(prev => [...prev, result.data!])
          setNewComment("")
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Delete comment
  const handleDelete = async (commentId: string) => {
    startTransition(async () => {
      const result = resourceType === 'event'
        ? await deleteEventComment(commentId)
        : await deleteProjectComment(commentId)

      if (result.success) {
        setComments(prev => removeComment(prev, commentId))
      }
    })
  }

  // Update comment
  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return

    startTransition(async () => {
      const result = resourceType === 'event'
        ? await updateEventComment(commentId, editContent)
        : await updateProjectComment(commentId, editContent)

      if (result.success && result.data) {
        setComments(prev => updateCommentInList(prev, commentId, result.data!))
        setEditingId(null)
        setEditContent("")
      }
    })
  }

  // Helper functions for updating comment state
  const addReplyToComment = (comments: CommentWithAuthor[], parentId: string, reply: CommentWithAuthor): CommentWithAuthor[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        }
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, reply)
        }
      }
      return comment
    })
  }

  const removeComment = (comments: CommentWithAuthor[], commentId: string): CommentWithAuthor[] => {
    return comments
      .filter(c => c.id !== commentId)
      .map(comment => ({
        ...comment,
        replies: comment.replies ? removeComment(comment.replies, commentId) : []
      }))
  }

  const updateCommentInList = (comments: CommentWithAuthor[], commentId: string, updated: CommentWithAuthor): CommentWithAuthor[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return { ...updated, replies: comment.replies }
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInList(comment.replies, commentId, updated)
        }
      }
      return comment
    })
  }

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">
          Comments {totalCount > 0 && `(${totalCount})`}
        </h3>
      </div>

      {/* New Comment Input */}
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            You
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleAddComment()}
              disabled={!newComment.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={(id) => {
                setReplyingTo(id)
                setReplyContent("")
              }}
              onDelete={handleDelete}
              onEdit={(id, content) => {
                setEditingId(id)
                setEditContent(content)
              }}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={() => handleAddComment(replyingTo!)}
              onCancelReply={() => {
                setReplyingTo(null)
                setReplyContent("")
              }}
              editingId={editingId}
              editContent={editContent}
              setEditContent={setEditContent}
              onSubmitEdit={() => handleUpdate(editingId!)}
              onCancelEdit={() => {
                setEditingId(null)
                setEditContent("")
              }}
              isLoading={isLoading}
              isPending={isPending}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: CommentWithAuthor
  currentUserId: string
  onReply: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
  replyingTo: string | null
  replyContent: string
  setReplyContent: (content: string) => void
  onSubmitReply: () => void
  onCancelReply: () => void
  editingId: string | null
  editContent: string
  setEditContent: (content: string) => void
  onSubmitEdit: () => void
  onCancelEdit: () => void
  isLoading: boolean
  isPending: boolean
  depth?: number
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onEdit,
  replyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  onCancelReply,
  editingId,
  editContent,
  setEditContent,
  onSubmitEdit,
  onCancelEdit,
  isLoading,
  isPending,
  depth = 0
}: CommentItemProps) {
  const isOwner = comment.author_id === currentUserId
  const isEditing = editingId === comment.id
  const isReplying = replyingTo === comment.id
  const timeAgo = comment.created_at
    ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
    : 'just now'
  const wasEdited = comment.updated_at && comment.created_at && comment.updated_at !== comment.created_at

  return (
    <div className={cn("group", depth > 0 && "ml-8 pl-4 border-l-2 border-muted")}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {comment.author.full_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.author.full_name}</span>
            {comment.author.job_title && (
              <span className="text-xs text-muted-foreground">• {comment.author.job_title}</span>
            )}
            <span className="text-xs text-muted-foreground">• {timeAgo}</span>
            {wasEdited && <span className="text-xs text-muted-foreground">(edited)</span>}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={isPending}>
                  Cancel
                </Button>
                <Button size="sm" onClick={onSubmitEdit} disabled={isPending || !editContent.trim()}>
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 text-foreground whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onReply(comment.id)}
              >
                <CornerDownRight className="h-3 w-3 mr-1" />
                Reply
              </Button>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => onEdit(comment.id, comment.content)}>
                      <Pencil className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-3 flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] resize-none text-sm flex-1"
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={onSubmitReply} disabled={isLoading || !replyContent.trim()}>
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelReply}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              editingId={editingId}
              editContent={editContent}
              setEditContent={setEditContent}
              onSubmitEdit={onSubmitEdit}
              onCancelEdit={onCancelEdit}
              isLoading={isLoading}
              isPending={isPending}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
