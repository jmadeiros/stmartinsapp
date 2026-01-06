"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, Target, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createProject } from "@/lib/actions/projects"
import { useRouter } from "next/navigation"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
  orgId?: string
}

export function CreateProjectDialog({ open, onOpenChange, userId, orgId }: CreateProjectDialogProps) {
  const router = useRouter()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    impactGoal: "",
    cause: "",
    targetDate: "",
    needsVolunteers: false,
    volunteersNeeded: "",
    needsParticipants: false,
    participantsNeeded: "",
    participantTypes: "",
    needsResources: false,
    resourcesRequested: "",
    needsFundraising: false,
    fundraisingGoal: "",
    seekingPartners: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !orgId) {
      setError("User ID or Organization ID is missing")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createProject({
        title: formData.title,
        description: formData.description,
        impactGoal: formData.impactGoal,
        authorId: userId,
        orgId: orgId,
        cause: formData.cause || undefined,
        targetDate: formData.targetDate || undefined,
        volunteersNeeded: formData.needsVolunteers && formData.volunteersNeeded ? parseInt(formData.volunteersNeeded) : undefined,
        resourcesRequested: formData.needsResources && formData.resourcesRequested ? formData.resourcesRequested : undefined,
        fundraisingGoal: formData.needsFundraising && formData.fundraisingGoal ? formData.fundraisingGoal : undefined,
        seekingPartners: formData.seekingPartners,
      })

      if (result.success) {
        // Reset form
        setFormData({
          title: "",
          description: "",
          impactGoal: "",
          cause: "",
          targetDate: "",
          needsVolunteers: false,
          volunteersNeeded: "",
          needsParticipants: false,
          participantsNeeded: "",
          participantTypes: "",
          needsResources: false,
          resourcesRequested: "",
          needsFundraising: false,
          fundraisingGoal: "",
          seekingPartners: false,
        })
        setShowAdvanced(false)
        onOpenChange(false)
        // Refresh the page to show new project
        router.refresh()
      } else {
        setError(result.error || "Failed to create project")
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
            <Target className="h-5 w-5 text-emerald-600" />
            Create Project
          </DialogTitle>
          <DialogDescription>
            Start a collaborative initiative with your network. Required fields are marked with *
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Required Fields */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
            <h3 className="text-sm font-semibold text-foreground">Project Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="Urban Tree Planting Initiative"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project, what you're trying to achieve, and how others can help..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impactGoal">Impact Goal * (min 20 characters)</Label>
              <Textarea
                id="impactGoal"
                placeholder="Plant 5,000 trees across 10 neighborhoods by spring to increase urban tree coverage and combat climate change"
                value={formData.impactGoal}
                onChange={(e) => setFormData({ ...formData, impactGoal: e.target.value })}
                className="min-h-[80px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.impactGoal.length}/20 characters - Clear, measurable outcome you&apos;re working toward
              </p>
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
                    placeholder="e.g., Environment, Education, Healthcare"
                    value={formData.cause}
                    onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional - leave blank for ongoing projects
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
                        placeholder="e.g., 100"
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
                          placeholder="e.g., Kids aged 5-12, Elderly residents"
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
                    <Label htmlFor="needsResources" className="font-normal cursor-pointer">
                      Resources Needed
                    </Label>
                    <Switch
                      id="needsResources"
                      checked={formData.needsResources}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        needsResources: checked,
                        resourcesRequested: checked ? formData.resourcesRequested : ""
                      })}
                    />
                  </div>

                  {formData.needsResources && (
                    <div className="pl-4 mt-2">
                      <Input
                        id="resourcesRequested"
                        placeholder="e.g., Laptops, Venue space, Transportation"
                        value={formData.resourcesRequested}
                        onChange={(e) => setFormData({ ...formData, resourcesRequested: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        What resources do you need? (comma-separated)
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="needsFundraising" className="font-normal cursor-pointer">
                      Fundraising Goal
                    </Label>
                    <Switch
                      id="needsFundraising"
                      checked={formData.needsFundraising}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        needsFundraising: checked,
                        fundraisingGoal: checked ? formData.fundraisingGoal : ""
                      })}
                    />
                  </div>

                  {formData.needsFundraising && (
                    <div className="pl-4 mt-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                        <Input
                          id="fundraisingGoal"
                          type="number"
                          placeholder="e.g., 5000"
                          min="1"
                          className="pl-7"
                          value={formData.fundraisingGoal}
                          onChange={(e) => setFormData({ ...formData, fundraisingGoal: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        How much funding do you need?
                      </p>
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={!formData.title || !formData.description || !formData.impactGoal || formData.impactGoal.length < 20 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

