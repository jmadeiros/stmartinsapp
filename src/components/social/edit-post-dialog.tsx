"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Edit2 } from "lucide-react"
import { CategorySelector } from "@/components/ui/category-selector"
import { updatePost, type PostCategory } from "@/lib/actions/posts"
import { useRouter } from "next/navigation"
import type { Post } from "@/lib/types"

interface EditPostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: Post
  onPostUpdated?: () => void
}

export function EditPostDialog({ open, onOpenChange, post, onPostUpdated }: EditPostDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState(post.content || "")
  const [category, setCategory] = useState<PostCategory>(post.category || "general")

  // Reset form when dialog opens with new post data
  useEffect(() => {
    if (open) {
      setContent(post.content || "")
      setCategory(post.category || "general")
      setError(null)
    }
  }, [open, post.content, post.category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate content
    if (!content.trim()) {
      setError("Post content cannot be empty")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updatePost(post.id, {
        content: content.trim(),
        category,
      })

      if (result.success) {
        // Close dialog
        onOpenChange(false)

        // Notify parent
        if (onPostUpdated) {
          onPostUpdated()
        }

        // Refresh to show updated post
        router.refresh()
      } else {
        setError(result.error || "Failed to update post")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = content.trim() !== post.content || category !== post.category

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            Edit Post
          </DialogTitle>
          <DialogDescription>
            Make changes to your post. Your followers will see the updated version.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="edit-content" className="text-sm font-medium text-gray-700">
              Content <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {/* Highlighted text overlay (shows @mentions in blue) */}
              <div
                className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-base p-3 text-transparent border rounded-md"
                style={{
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}
              >
                {content.split(/(@\[[^\]]+\]|@\w+)/g).map((part, i) => (
                  <span
                    key={i}
                    className={part.startsWith('@') ? 'text-blue-600 font-medium' : ''}
                  >
                    {part}
                  </span>
                ))}
              </div>
              <textarea
                id="edit-content"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="relative w-full min-h-[150px] resize-none rounded-md border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                style={{
                  background: 'transparent',
                  color: 'transparent',
                  caretColor: '#111827'
                }}
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500">
              {content.length} characters
            </p>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Category
            </label>
            <CategorySelector
              selected={category}
              onChange={setCategory}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim() || !hasChanges}
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
