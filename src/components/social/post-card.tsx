"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Heart, ExternalLink, Calendar, Target, Send, Trash2, Edit2, Pin, Image as ImageIcon, X, Loader2, Paperclip, Smile } from "lucide-react"
import { ContentBadge } from "@/components/ui/content-badge"
import { CategoryBadge } from "@/components/ui/category-badge"
import { PostMenu } from "@/components/ui/post-menu"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { CategorySelector } from "@/components/ui/category-selector"
import type { Post, PostCategory } from "@/lib/types"
import { uploadPostImage } from "@/lib/actions/storage"
import { getComments, addComment, deleteComment, getCommentCount, type CommentWithAuthor } from "@/lib/actions/comments"
import { createClient } from "@/lib/supabase/client"
import { toggleReaction, getReactionData } from "@/lib/actions/reactions"
import { getPollByPostId, type Poll } from "@/lib/actions/polls"
import { PollCard } from "@/components/social/poll-card"
import { pinPost, unpinPost, acknowledgePost, hasUserAcknowledged, getPostAcknowledgments, updatePost } from "@/lib/actions/posts"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
// EditPostDialog removed - using inline editing (Twitter-style) instead

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [commentCount, setCommentCount] = useState(post.comments || 0)
  const [newCommentText, setNewCommentText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Reaction states
  const [reactionCount, setReactionCount] = useState(post.likes || 0)
  const [hasReacted, setHasReacted] = useState(false)
  const [isLoadingReaction, setIsLoadingReaction] = useState(false)

  // Poll state
  const [poll, setPoll] = useState<Poll | null>(null)
  const [pollLoading, setPollLoading] = useState(true)

  // Pin state
  const [isPinned, setIsPinned] = useState(post.isPinned || false)

  // Acknowledgment state
  const [hasAcknowledged, setHasAcknowledged] = useState(false)
  const [acknowledgmentCount, setAcknowledgmentCount] = useState(0)
  const [isAcknowledging, setIsAcknowledging] = useState(false)

  // Inline edit state (Twitter-style)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editCategory, setEditCategory] = useState<PostCategory>(post.category as PostCategory || "general")
  const [editTitle, setEditTitle] = useState(post.title || "")
  const [editImage, setEditImage] = useState<{ preview: string; file: File } | null>(null)
  const [editImageUrl, setEditImageUrl] = useState<string | null>(post.image || null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const editImageInputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()

  // Get current user, check if admin, and check if author
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id)

        // Check if user is admin
        const { data: profile } = await (supabase
          .from('user_profiles') as any)
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (profile && profile.role === 'admin') {
          setIsAdmin(true)
        }

        // Check if user is the author of this post
        const { data: postData } = await (supabase
          .from('posts') as any)
          .select('author_id')
          .eq('id', post.id)
          .single()

        if (postData && postData.author_id === user.id) {
          setIsAuthor(true)
        }
      }
    })
  }, [post.id])

  // Fetch reaction data on mount
  useEffect(() => {
    async function fetchReactionData() {
      const { count, hasReacted: userReacted } = await getReactionData(post.id)
      setReactionCount(count)
      setHasReacted(userReacted)
    }
    fetchReactionData()
  }, [post.id])

  // Fetch comment count on mount
  useEffect(() => {
    async function fetchCommentCount() {
      const { count } = await getCommentCount(post.id)
      setCommentCount(count)
    }
    fetchCommentCount()
  }, [post.id])

  // Fetch poll data if exists
  useEffect(() => {
    async function fetchPoll() {
      setPollLoading(true)
      const pollData = await getPollByPostId(post.id)
      setPoll(pollData)
      setPollLoading(false)
    }
    fetchPoll()
  }, [post.id])

  // Fetch acknowledgment data for pinned posts (priority alerts)
  useEffect(() => {
    async function fetchAcknowledgments() {
      if (!isPinned || !currentUserId) return

      const { data: hasAcked } = await hasUserAcknowledged(post.id, currentUserId)
      const { data: ackData } = await getPostAcknowledgments(post.id)

      setHasAcknowledged(hasAcked || false)
      setAcknowledgmentCount(ackData?.count || 0)
    }
    fetchAcknowledgments()
  }, [post.id, isPinned, currentUserId])

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

  // Handle pin post
  const handlePinPost = async () => {
    try {
      const result = await pinPost(post.id)
      if (result.success) {
        setIsPinned(true)
        toast({
          title: "Post pinned",
          description: "This post has been pinned to the top of the feed.",
        })
      } else {
        toast({
          title: "Failed to pin post",
          description: result.error || "An error occurred while pinning the post.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle unpin post
  const handleUnpinPost = async () => {
    try {
      const result = await unpinPost(post.id)
      if (result.success) {
        setIsPinned(false)
        toast({
          title: "Post unpinned",
          description: "This post has been unpinned from the feed.",
        })
      } else {
        toast({
          title: "Failed to unpin post",
          description: result.error || "An error occurred while unpinning the post.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle acknowledge post
  const handleAcknowledgePost = async () => {
    if (isAcknowledging || hasAcknowledged) return

    setIsAcknowledging(true)
    try {
      const result = await acknowledgePost(post.id)
      if (result.success) {
        setHasAcknowledged(true)
        setAcknowledgmentCount(prev => prev + 1)
        toast({
          title: "Acknowledged",
          description: "You have acknowledged this priority alert.",
        })
      } else {
        toast({
          title: "Failed to acknowledge",
          description: result.error || "An error occurred while acknowledging the post.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsAcknowledging(false)
    }
  }

  // Handle inline edit save (Twitter-style)
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Content required",
        description: "Please write something before saving.",
        variant: "destructive",
      })
      return
    }

    // Check if anything actually changed
    const contentChanged = editContent !== post.content
    const categoryChanged = editCategory !== (post.category || "general")
    const titleChanged = editTitle !== (post.title || "")
    const imageChanged = editImage !== null || editImageUrl !== post.image

    if (!contentChanged && !categoryChanged && !titleChanged && !imageChanged) {
      setIsEditing(false)
      return
    }

    setIsSavingEdit(true)
    setImageUploadError(null)

    try {
      // Upload new image if selected
      let finalImageUrl: string | null = editImageUrl

      if (editImage) {
        setIsUploadingImage(true)
        const uploadResult = await uploadPostImage(editImage.preview)
        setIsUploadingImage(false)

        if (!uploadResult.success) {
          setImageUploadError(uploadResult.error || "Failed to upload image")
          setIsSavingEdit(false)
          return
        }
        finalImageUrl = uploadResult.data?.publicUrl || null
      }

      const updateData: {
        content?: string
        category?: PostCategory
        title?: string
        image_url?: string | null
      } = {}

      if (contentChanged) updateData.content = editContent
      if (categoryChanged) updateData.category = editCategory
      if (titleChanged) updateData.title = editTitle || undefined
      if (imageChanged) updateData.image_url = finalImageUrl

      const result = await updatePost(post.id, updateData)

      if (result.success) {
        // Update local post data
        if (contentChanged) post.content = editContent
        if (categoryChanged) post.category = editCategory
        if (titleChanged) post.title = editTitle || undefined
        if (imageChanged) post.image = finalImageUrl || undefined

        setEditImageUrl(finalImageUrl)
        setEditImage(null)
        setIsEditing(false)
        toast({
          title: "Post updated",
          description: "Your changes have been saved.",
        })
      } else {
        toast({
          title: "Failed to save",
          description: result.error || "An error occurred while saving.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSavingEdit(false)
      setIsUploadingImage(false)
    }
  }

  // Handle image selection for edit mode
  const handleEditImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setImageUploadError('Invalid file type. Please use JPEG, PNG, GIF, or WebP.')
      return
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setImageUploadError('File too large. Maximum size is 50MB.')
      return
    }

    // Read and set preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      setEditImage({ preview: base64Data, file })
      setImageUploadError(null)
    }
    reader.onerror = () => {
      setImageUploadError('Failed to read file')
    }
    reader.readAsDataURL(file)

    // Reset input to allow re-selecting same file
    if (editImageInputRef.current) {
      editImageInputRef.current.value = ''
    }
  }, [])

  // Handle removing image in edit mode
  const handleEditImageRemove = useCallback(() => {
    setEditImage(null)
    setEditImageUrl(null)
    setImageUploadError(null)
  }, [])

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditContent(post.content)
    setEditCategory(post.category as PostCategory || "general")
    setEditTitle(post.title || "")
    setEditImage(null)
    setEditImageUrl(post.image || null)
    setImageUploadError(null)
    setIsEditing(false)
  }

  // Handle edit button click
  const handleEditClick = () => {
    setEditContent(post.content)
    setEditCategory(post.category as PostCategory || "general")
    setEditTitle(post.title || "")
    setEditImage(null)
    setEditImageUrl(post.image || null)
    setImageUploadError(null)
    setIsEditing(true)
  }

  // Determine CTA based on linked content
  const getCTA = () => {
    if (post.linkedEventId) {
      return {
        text: "View Event",
        icon: Calendar,
        onClick: () => router.push(`/events/${post.linkedEventId}`)
      }
    }
    if (post.linkedProjectId) {
      return {
        text: "View Project",
        icon: Target,
        onClick: () => router.push(`/projects/${post.linkedProjectId}`)
      }
    }
    return null
  }

  const cta = getCTA()

  return (
    <Card className={cn(
      "text-card-foreground flex flex-col rounded-2xl overflow-hidden bg-white shadow-md transition-shadow",
      isPinned 
        ? "border-amber-200 shadow-sm hover:shadow-md" 
        : "border-gray-100 hover:shadow-lg"
    )}>
      {isPinned && (
        <div className="px-4 py-1.5 bg-amber-50/50 border-b border-amber-100 flex items-center gap-2">
          <Pin className="h-3 w-3 text-amber-600 fill-amber-600" />
          <span className="text-xs font-medium text-amber-700">Pinned Post</span>
        </div>
      )}
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
            isAuthor={isAuthor}
            isAdmin={isAdmin}
            isPinned={isPinned}
            onEdit={handleEditClick}
            onShare={() => {}}
            onReport={() => {}}
            onLinkToEvent={() => {}}
            onLinkToProject={() => {}}
            onPin={handlePinPost}
            onUnpin={handleUnpinPost}
          />
        </div>

        {/* EDIT MODE - Full inline editor */}
        {isEditing ? (
          <div className="mb-4 space-y-4 p-4 -mx-4 bg-muted/30 rounded-lg border border-border/50">
            {/* Category Selector */}
            <div className="pb-3 border-b border-border/50">
              <CategorySelector
                selected={editCategory}
                onChange={setEditCategory}
              />
            </div>

            {/* Optional Title Input */}
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Add a title (optional)"
              className="text-lg font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
              disabled={isSavingEdit}
            />

            {/* Content Textarea */}
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] text-sm leading-relaxed resize-none border-0 bg-transparent px-0 focus-visible:ring-0"
              placeholder="What's on your mind?"
              disabled={isSavingEdit}
              autoFocus
            />

            {/* Image Preview - Shows when there's an image */}
            {(editImage || editImageUrl) && (
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={editImage?.preview || editImageUrl || ""}
                  alt="Preview"
                  className="w-full max-h-48 object-cover"
                />
                {/* Remove image button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full p-0"
                  onClick={handleEditImageRemove}
                  disabled={isSavingEdit || isUploadingImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {/* Upload indicator overlay */}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-sm font-medium">Uploading...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Image upload error */}
            {imageUploadError && (
              <p className="text-sm text-destructive">{imageUploadError}</p>
            )}

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              {/* Hidden file input for image upload */}
              <input
                ref={editImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleEditImageSelect}
                className="hidden"
                disabled={isSavingEdit || isUploadingImage}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editImageInputRef.current?.click()}
                disabled={isSavingEdit || isUploadingImage}
                className={cn(
                  "text-muted-foreground hover:text-primary hover:bg-primary/5 h-9 px-3 gap-2",
                  (editImage || editImageUrl) && "text-primary bg-primary/10"
                )}
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {editImage || editImageUrl ? "Change" : "Photo"}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-muted-foreground h-9 px-3 gap-2 opacity-50"
              >
                <Paperclip className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Attachment</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-muted-foreground h-9 px-3 gap-2 opacity-50"
              >
                <Smile className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Emoji</span>
              </Button>

              {/* Save/Cancel Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !editContent.trim()}
                  className="gap-2"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Badges - Category and Cause (VIEW MODE) */}
            {(post.category || post.cause) && (
              <div className="mb-3 flex flex-wrap gap-2">
                {post.category && <CategoryBadge category={post.category} />}
                {/* Only show cause for learnings - other categories won't have that option */}
                {post.cause && post.category === 'learnings' && (
                  <ContentBadge type="cause" label={post.cause} />
                )}
              </div>
            )}

            {/* Title (optional) - VIEW MODE */}
            {post.title && (
              <h2 className="mb-2 text-lg font-bold text-foreground tracking-tight">{post.title}</h2>
            )}

            {/* Content - VIEW MODE */}
            <p className="mb-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>
          </>
        )}

        {/* Linked Content Indicator */}
        {(post.linkedEventId || post.linkedProjectId) && (
          <div
            className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => {
              if (post.linkedEventId) {
                router.push(`/events/${post.linkedEventId}`)
              } else if (post.linkedProjectId) {
                router.push(`/projects/${post.linkedProjectId}`)
              }
            }}
          >
            <div className="flex items-center gap-2 text-sm">
              {post.linkedEventId ? (
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {post.linkedEventId ? "Related Event" : "Related Project"}
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </div>
          </div>
        )}

        {/* Image (if attached) - VIEW MODE ONLY */}
        {!isEditing && post.image && (
          <div className="mb-4 overflow-hidden rounded-xl">
            <img src={post.image} alt={post.title || "Post image"} className="h-[150px] sm:h-[200px] w-full object-cover" />
          </div>
        )}

        {/* Poll (if attached) */}
        {!pollLoading && poll && (
          <PollCard initialPoll={poll} showInline={true} />
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


