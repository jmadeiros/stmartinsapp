"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SendAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (alert: {
    priority: "high" | "medium"
    title: string
    message: string
    audience: string
  }) => void
}

export function SendAlertDialog({ open, onOpenChange, onSend }: SendAlertDialogProps) {
  const [priority, setPriority] = useState<"high" | "medium">("high")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [audience, setAudience] = useState("All Teams")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSend({
      priority,
      title,
      message,
      audience
    })
    
    // Reset form
    setTitle("")
    setMessage("")
    setPriority("high")
    setAudience("All Teams")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Send Alert
          </DialogTitle>
          <DialogDescription>
            Send an urgent alert that will be pinned to the top of the feed. Use sparingly for time-sensitive information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Priority Selection */}
          <div className="space-y-2">
            <Label>Priority Level *</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPriority("high")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                  priority === "high"
                    ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">High Priority</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority("medium")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                  priority === "medium"
                    ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">Medium Priority</span>
              </button>
            </div>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label htmlFor="audience">Send To *</Label>
            <Input
              id="audience"
              placeholder="e.g., All Teams, Blink Team, etc."
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              required
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Alert Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Electricity outage expected!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Provide details about the alert..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Warning */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800">
              ⚠️ This alert will be pinned at the top of the feed and visible to all selected recipients. 
              Please ensure the information is accurate and time-sensitive.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                "flex-1",
                priority === "high" 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-amber-600 hover:bg-amber-700"
              )}
              disabled={!title || !message || !audience}
            >
              Send Alert
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

