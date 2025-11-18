"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Calendar, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    cause: "",
    volunteersNeeded: "",
    participantPrograms: "",
    seekingPartners: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating event:", formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Create Event
          </DialogTitle>
          <DialogDescription>
            Share a community event with your network. Required fields are marked with *
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Required Fields */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
            <h3 className="text-sm font-semibold text-foreground">Event Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="Community Food Drive & Distribution"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your event and what you hope to achieve..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="Community Center, Downtown"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Advanced Options - Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 justify-between"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Advanced Options
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    showAdvanced && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4">
              <div className="space-y-4 p-4 rounded-lg border border-border">
                <div className="space-y-2">
                  <Label htmlFor="cause">Cause Tag</Label>
                  <Input
                    id="cause"
                    placeholder="e.g., Food Security, Education, Healthcare"
                    value={formData.cause}
                    onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Categorize your event to help others find it
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volunteersNeeded">Volunteers Needed</Label>
                  <Input
                    id="volunteersNeeded"
                    type="number"
                    placeholder="25"
                    min="0"
                    value={formData.volunteersNeeded}
                    onChange={(e) => setFormData({ ...formData, volunteersNeeded: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participantPrograms">Participants Needed</Label>
                  <Input
                    id="participantPrograms"
                    placeholder="e.g., After-School Program, Youth Group"
                    value={formData.participantPrograms}
                    onChange={(e) => setFormData({ ...formData, participantPrograms: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated program types
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="seekingPartners"
                    checked={formData.seekingPartners}
                    onChange={(e) => setFormData({ ...formData, seekingPartners: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="seekingPartners" className="font-normal cursor-pointer">
                    Seeking partner organizations
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Footer Actions */}
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
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!formData.title || !formData.description || !formData.date || !formData.time || !formData.location}
            >
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

