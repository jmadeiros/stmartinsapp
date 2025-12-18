"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Plus, Loader2, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createPoll } from "@/lib/actions/polls"
import { useRouter } from "next/navigation"

interface CreatePollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId?: string
  onPollCreated?: (pollId: string) => void
}

export function CreatePollDialog({ open, onOpenChange, postId, onPollCreated }: CreatePollDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [hasExpiration, setHasExpiration] = useState(false)
  const [expiresAt, setExpiresAt] = useState("")

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!postId) {
      setError("No post selected for poll")
      return
    }

    // Validate question
    if (!question.trim()) {
      setError("Please enter a question")
      return
    }

    // Validate options
    const validOptions = options.filter(opt => opt.trim() !== "")
    if (validOptions.length < 2) {
      setError("Please provide at least 2 options")
      return
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()))
    if (uniqueOptions.size !== validOptions.length) {
      setError("Please remove duplicate options")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createPoll({
        postId,
        question: question.trim(),
        options: validOptions,
        allowMultiple,
        expiresAt: hasExpiration && expiresAt ? expiresAt : undefined
      })

      if (result.success && result.data) {
        // Reset form
        setQuestion("")
        setOptions(["", ""])
        setAllowMultiple(false)
        setHasExpiration(false)
        setExpiresAt("")
        setError(null)

        // Notify parent and close dialog
        if (onPollCreated && result.data.id) {
          onPollCreated(result.data.id)
        }
        onOpenChange(false)

        // Refresh to show new poll
        router.refresh()
      } else {
        setError(result.error || "Failed to create poll")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Create Poll
          </DialogTitle>
          <DialogDescription>
            Ask your community a question with multiple choice answers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">
              Question <span className="text-red-500">*</span>
            </Label>
            <Input
              id="question"
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-500">
              {question.length}/200 characters
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>
              Options <span className="text-red-500">*</span>
            </Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    maxLength={100}
                    required={index < 2}
                  />
                </div>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </Button>
            )}

            <p className="text-xs text-gray-500">
              {options.length}/10 options
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-multiple" className="text-sm font-medium">
                  Allow multiple choices
                </Label>
                <p className="text-xs text-gray-500">
                  Let people select more than one option
                </p>
              </div>
              <Switch
                id="allow-multiple"
                checked={allowMultiple}
                onCheckedChange={setAllowMultiple}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="has-expiration" className="text-sm font-medium">
                  Set expiration date
                </Label>
                <p className="text-xs text-gray-500">
                  Poll will close after this date
                </p>
              </div>
              <Switch
                id="has-expiration"
                checked={hasExpiration}
                onCheckedChange={setHasExpiration}
              />
            </div>

            {hasExpiration && (
              <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                <Label htmlFor="expires-at" className="text-sm">
                  Expiration Date & Time
                </Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Votes cannot be changed after submitting. Results are visible to all participants.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
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
              disabled={isSubmitting || !question.trim() || options.filter(o => o.trim()).length < 2}
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Create Poll
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
