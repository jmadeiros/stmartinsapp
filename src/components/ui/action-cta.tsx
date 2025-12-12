"use client"

import { useState, useRef, useEffect } from "react"
import { HandHeart, Users, Building2, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Needs } from "@/lib/social/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ActionCTAProps {
  type: "event" | "project"
  needs?: Needs
  onAction: (response: ActionResponse) => void
  className?: string
  buttonLabel?: string
}

export interface ActionResponse {
  primaryAction: boolean
  volunteer?: boolean
  bringParticipants?: boolean
  participantCount?: number
  canPartner?: boolean
  notes?: string
}

export function ActionCTA({ type, needs, onAction, className, buttonLabel }: ActionCTAProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [response, setResponse] = useState<Partial<ActionResponse>>({
    volunteer: false,
    bringParticipants: false,
    canPartner: false,
    participantCount: undefined,
    notes: "",
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  const buttonText = buttonLabel ?? "Respond"
  const hasNeeds =
    needs && (needs.volunteersNeeded || needs.participantRequests?.length || needs.seekingPartners || needs.resourcesRequested?.length || needs.fundraisingGoal)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (showDropdown) {
          handleComplete()
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showDropdown, response])

  const handlePrimaryClick = () => {
    if (hasNeeds) {
      setShowDropdown(true)
      return
    }

    onAction({ primaryAction: true })
  }

  const handleComplete = () => {
    setShowDropdown(false)
    onAction({
      primaryAction: true,
      ...response,
    } as ActionResponse)
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <Button onClick={handlePrimaryClick} size="sm" variant="outline" className="gap-2">
        <HandHeart className="h-3.5 w-3.5" />
        {buttonText}
      </Button>

      {showDropdown && hasNeeds && (
        <Card className="absolute z-[100] mt-2 w-full min-w-[320px] left-0 p-4 shadow-xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200 bg-white">
          <div className="space-y-3">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-foreground mb-1">{type === "event" ? "You're in!" : "You're interested!"}</h4>
              <p className="text-xs text-muted-foreground">Pick all that apply:</p>
            </div>

            <div className="space-y-2">
              {needs?.volunteersNeeded && (
                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={response.volunteer}
                    onChange={(e) => setResponse({ ...response, volunteer: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <HandHeart className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-sm font-medium text-foreground">Volunteer</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{needs.volunteersNeeded} volunteers needed</p>
                  </div>
                </label>
              )}

              {needs?.participantRequests && needs.participantRequests.length > 0 && (
                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={response.bringParticipants}
                    onChange={(e) => setResponse({ ...response, bringParticipants: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-sm font-medium text-foreground">Bring participants</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {needs.participantRequests
                        .map((req) => (req.count ? `${req.programTag} (${req.count})` : req.programTag))
                        .join(", ")}
                    </p>
                    {response.bringParticipants && (
                      <input
                        type="number"
                        placeholder="How many?"
                        value={response.participantCount || ""}
                        onChange={(e) =>
                          setResponse({
                            ...response,
                            participantCount: e.target.value ? parseInt(e.target.value, 10) || undefined : undefined,
                          })
                        }
                        className="mt-2 w-full px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        min="1"
                      />
                    )}
                  </div>
                </label>
              )}

              {needs?.seekingPartners && (
                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={response.canPartner}
                    onChange={(e) => setResponse({ ...response, canPartner: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-sm font-medium text-foreground">We&apos;d love to collaborate!</span>
                    </div>
                  </div>
                </label>
              )}

              {type === "project" && needs?.resourcesRequested && needs.resourcesRequested.length > 0 && (
                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-sm font-medium text-foreground">Provide resources</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{needs.resourcesRequested.join(", ")}</p>
                  </div>
                </label>
              )}

              {type === "project" && needs?.fundraisingGoal && (
                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-sm font-medium text-foreground">Contribute funding</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Goal: {needs.fundraisingGoal}</p>
                  </div>
                </label>
              )}
            </div>

            <div className="pt-3 border-t border-border flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDropdown(false)} className="flex-1">
                Skip
              </Button>
              <Button size="sm" onClick={handleComplete} className="flex-1">
                Commit
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

