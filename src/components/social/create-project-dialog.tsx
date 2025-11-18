"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Target, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    impactGoal: "",
    cause: "",
    targetDate: "",
    volunteersNeeded: "",
    participantPrograms: "",
    resourcesRequested: "",
    fundraisingGoal: "",
    seekingPartners: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating project:", formData)
    onOpenChange(false)
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
                {formData.impactGoal.length}/20 characters - Clear, measurable outcome you're working toward
              </p>
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

                <div className="space-y-2">
                  <Label htmlFor="volunteersNeeded">Volunteers Needed</Label>
                  <Input
                    id="volunteersNeeded"
                    type="number"
                    placeholder="100"
                    min="0"
                    value={formData.volunteersNeeded}
                    onChange={(e) => setFormData({ ...formData, volunteersNeeded: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participantPrograms">Participants Needed</Label>
                  <Input
                    id="participantPrograms"
                    placeholder="e.g., Youth Programs, Senior Services"
                    value={formData.participantPrograms}
                    onChange={(e) => setFormData({ ...formData, participantPrograms: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated program types
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resourcesRequested">Resources Requested</Label>
                  <Input
                    id="resourcesRequested"
                    placeholder="e.g., Laptops, Venue, Transportation"
                    value={formData.resourcesRequested}
                    onChange={(e) => setFormData({ ...formData, resourcesRequested: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated resources
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundraisingGoal">Fundraising Goal</Label>
                  <Input
                    id="fundraisingGoal"
                    placeholder="e.g., $50,000"
                    value={formData.fundraisingGoal}
                    onChange={(e) => setFormData({ ...formData, fundraisingGoal: e.target.value })}
                  />
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={!formData.title || !formData.description || !formData.impactGoal || formData.impactGoal.length < 20}
            >
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

