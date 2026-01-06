"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { MultiSelect } from "@/components/ui/multiselect"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, Calendar, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createEvent, type EventCategory } from "@/lib/actions/events"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
  orgId?: string
}

export function CreateEventDialog({ open, onOpenChange, userId, orgId }: CreateEventDialogProps) {
  const router = useRouter()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "other" as EventCategory,
    cause: "",
    needsVolunteers: false,
    volunteersNeeded: "",
    needsParticipants: false,
    participantsNeeded: "",
    participantTypes: "",
    seekingPartners: false,
    inviteCollaborators: [] as string[],
  })

  // Mock organization data - will be replaced with real data from API
  const availableOrganizations = [
    { label: "Youth Action Network", value: "00000000-0000-0000-0000-000000000002" },
    { label: "Community Arts Trust", value: "00000000-0000-0000-0000-000000000003" },
    { label: "Elder Care Foundation", value: "00000000-0000-0000-0000-000000000004" },
    { label: "Food Security Alliance", value: "00000000-0000-0000-0000-000000000005" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !orgId) {
      setError("User ID or Organization ID is missing")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createEvent({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        organizerId: userId,
        orgId: orgId,
        category: formData.category,
        cause: formData.cause || undefined,
        volunteersNeeded: formData.needsVolunteers && formData.volunteersNeeded ? parseInt(formData.volunteersNeeded) : undefined,
        seekingPartners: formData.seekingPartners,
        inviteCollaborators: formData.inviteCollaborators.length > 0 ? formData.inviteCollaborators : undefined,
      })

      if (result.success) {
        // Reset form
        setFormData({
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          category: "other" as EventCategory,
          cause: "",
          needsVolunteers: false,
          volunteersNeeded: "",
          needsParticipants: false,
          participantsNeeded: "",
          participantTypes: "",
          seekingPartners: false,
          inviteCollaborators: [],
        })
        setShowAdvanced(false)
        onOpenChange(false)
        // Refresh the page to show new event
        router.refresh()
      } else {
        setError(result.error || "Failed to create event")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
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

            <div className="space-y-2">
              <Label htmlFor="category">Event Type *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: EventCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="building_event">Building Event</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Options - Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      showAdvanced && "rotate-180"
                    )}
                  />
                  {showAdvanced ? "Hide" : "Show"} additional options
                </span>
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="needsVolunteers" className="font-normal cursor-pointer">
                      Volunteers Needed
                    </Label>
                    <Switch
                      id="needsVolunteers"
                      checked={formData.needsVolunteers}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        needsVolunteers: checked,
                        volunteersNeeded: checked ? formData.volunteersNeeded : ""
                      })}
                    />
                  </div>

                  {formData.needsVolunteers && (
                    <div className="pl-4 mt-2">
                      <Input
                        id="volunteersNeeded"
                        type="number"
                        placeholder="e.g., 25"
                        min="1"
                        value={formData.volunteersNeeded}
                        onChange={(e) => setFormData({ ...formData, volunteersNeeded: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        How many volunteers do you need?
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="needsParticipants" className="font-normal cursor-pointer">
                      Participants Needed
                    </Label>
                    <Switch
                      id="needsParticipants"
                      checked={formData.needsParticipants}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        needsParticipants: checked,
                        participantsNeeded: checked ? formData.participantsNeeded : "",
                        participantTypes: checked ? formData.participantTypes : ""
                      })}
                    />
                  </div>

                  {formData.needsParticipants && (
                    <div className="pl-4 mt-2 space-y-3">
                      <div>
                        <Input
                          id="participantsNeeded"
                          type="number"
                          placeholder="e.g., 50"
                          min="1"
                          value={formData.participantsNeeded}
                          onChange={(e) => setFormData({ ...formData, participantsNeeded: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          How many participants do you need?
                        </p>
                      </div>
                      <div>
                        <Input
                          id="participantTypes"
                          type="text"
                          placeholder="e.g., After-School Program, Youth Group"
                          value={formData.participantTypes}
                          onChange={(e) => setFormData({ ...formData, participantTypes: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          What type of participants? (optional)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="seekingPartners" className="font-normal cursor-pointer">
                        Seeking Partner Collaboration
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Other organisations can express interest in partnering
                      </p>
                    </div>
                    <Switch
                      id="seekingPartners"
                      checked={formData.seekingPartners}
                      onCheckedChange={(checked) => setFormData({ ...formData, seekingPartners: checked })}
                    />
                  </div>

                  {formData.seekingPartners && (
                    <div className="pl-4 mt-2">
                      <Label htmlFor="inviteCollaborators">Invite Organizations</Label>
                      <MultiSelect
                        options={availableOrganizations}
                        selected={formData.inviteCollaborators}
                        onChange={(values) => setFormData({ ...formData, inviteCollaborators: values })}
                        placeholder="Select organizations to invite..."
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Organizations will receive a collaboration invitation
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!formData.title || !formData.description || !formData.date || !formData.time || !formData.location || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

