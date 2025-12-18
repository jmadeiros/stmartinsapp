'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Bug, Lightbulb, HelpCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { submitFeedback, type SubmitFeedbackParams } from '@/lib/actions/feedback'
import { cn } from '@/lib/utils'

interface FeedbackDialogProps {
  trigger?: React.ReactNode
  defaultOpen?: boolean
}

const feedbackTypes = [
  {
    value: 'bug' as const,
    label: 'Bug Report',
    description: 'Something is broken or not working as expected',
    icon: Bug,
    color: 'text-red-600',
  },
  {
    value: 'feature' as const,
    label: 'Feature Request',
    description: 'Suggest a new feature or improvement',
    icon: Lightbulb,
    color: 'text-yellow-600',
  },
  {
    value: 'general' as const,
    label: 'General Feedback',
    description: 'Share your thoughts or suggestions',
    icon: MessageSquare,
    color: 'text-blue-600',
  },
  {
    value: 'question' as const,
    label: 'Question',
    description: 'Ask about how something works',
    icon: HelpCircle,
    color: 'text-purple-600',
  },
]

export function FeedbackDialog({ trigger, defaultOpen = false }: FeedbackDialogProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [feedbackType, setFeedbackType] = useState<SubmitFeedbackParams['feedback_type']>('general')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pageUrl, setPageUrl] = useState('')

  // Capture current page URL when dialog opens
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      setPageUrl(window.location.href)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await submitFeedback({
        feedback_type: feedbackType,
        description,
        page_url: pageUrl,
      })

      if (result.success) {
        setSuccess(true)
        // Reset form after short delay
        setTimeout(() => {
          setDescription('')
          setFeedbackType('general')
          setSuccess(false)
          setOpen(false)
        }, 2000)
      } else {
        setError(result.error || 'Failed to submit feedback')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedType = feedbackTypes.find((t) => t.value === feedbackType)
  const charCount = description.length
  const maxChars = 2000

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve The Village Hub by sharing your feedback, reporting bugs, or suggesting new features.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-sm text-muted-foreground">
              Your feedback has been submitted successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="feedback-type">What would you like to share?</Label>
              <Select value={feedbackType} onValueChange={(value: any) => setFeedbackType(value)}>
                <SelectTrigger id="feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', type.color)} />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-xs text-muted-foreground">{selectedType.description}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder={
                  feedbackType === 'bug'
                    ? 'Please describe what happened and what you expected to happen...'
                    : feedbackType === 'feature'
                    ? 'Describe the feature you would like to see...'
                    : feedbackType === 'question'
                    ? 'What would you like to know?...'
                    : 'Share your feedback...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={maxChars}
                required
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Be as detailed as possible</span>
                <span className={cn(charCount > maxChars * 0.9 && 'text-orange-600')}>
                  {charCount}/{maxChars}
                </span>
              </div>
            </div>

            {/* Page URL (auto-filled, read-only) */}
            <div className="space-y-2">
              <Label htmlFor="page-url" className="text-xs">
                Current Page
              </Label>
              <input
                id="page-url"
                type="text"
                value={pageUrl}
                readOnly
                className="w-full px-3 py-2 text-xs bg-muted rounded-md border border-input"
              />
              <p className="text-xs text-muted-foreground">
                This helps us understand the context of your feedback
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !description.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
