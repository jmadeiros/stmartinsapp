"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Edit, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateOrganization } from "@/lib/actions/organizations"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface OrgHeaderProps {
  organization: {
    id: string
    name: string
    logo_url: string | null
    room_location: string | null
    cause_areas: string[] | null
    primary_color: string | null
    website: string | null
  }
  canEdit: boolean
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function OrgHeader({ organization, canEdit }: OrgHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [roomLocation, setRoomLocation] = useState(organization.room_location || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const orgColor = organization.primary_color || '#10b981'

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const { success, error } = await updateOrganization(organization.id, {
        room_location: roomLocation || undefined,
      })

      if (success) {
        setIsEditDialogOpen(false)
        router.refresh()
      } else {
        alert(error || 'Failed to update room location')
      }
    } catch (err) {
      console.error('Error updating room location:', err)
      alert('Failed to update room location')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="rounded-3xl border border-border/50 bg-[var(--surface)]/80 p-8 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-6 flex-1">
            {/* Category Badge */}
            {organization.cause_areas && organization.cause_areas.length > 0 && (
              <Badge
                variant="secondary"
                className="w-fit px-3 py-1 text-sm font-medium border-0"
                style={{ backgroundColor: `${orgColor}15`, color: orgColor }}
              >
                {organization.cause_areas[0]}
              </Badge>
            )}

            {/* Org Name & Logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-xl border border-border/50 shadow-sm">
                  {organization.logo_url ? (
                    <AvatarImage src={organization.logo_url} className="object-contain p-1" />
                  ) : (
                    <AvatarFallback className="bg-transparent font-bold text-lg" style={{ color: orgColor }}>
                      {getInitials(organization.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{organization.name}</h1>
              </div>

              {/* Room Location */}
              <div className="flex items-center gap-2">
                {organization.room_location ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{organization.room_location}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground/50">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm italic">No room location set</span>
                  </div>
                )}
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Cause Areas & Website */}
            <div className="flex flex-wrap gap-2">
              {organization.cause_areas?.map((tag) => (
                <Badge key={tag} variant="outline" className="border-border/50 bg-background/50">
                  {tag}
                </Badge>
              ))}
              {organization.website && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground" asChild>
                  <a href={organization.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="mr-1.5 h-3 w-3" />
                    Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Room Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room Location</DialogTitle>
            <DialogDescription>
              Update the physical location of this organization within the building.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room_location">Room Location</Label>
              <Input
                id="room_location"
                placeholder="e.g., Room 205, Ground Floor, West Wing"
                value={roomLocation}
                onChange={(e) => setRoomLocation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
