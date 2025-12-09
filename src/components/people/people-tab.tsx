"use client"

import { useMemo } from "react"
import { Users, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SphereImageGrid, { type ImageData } from "@/components/social/aitrium/sphere-image-grid"
import { PersonCard } from "./person-card"
import type { PersonProfile, OrganizationProfile } from "@/app/(authenticated)/people/actions"

interface PeopleTabProps {
  people: PersonProfile[]  // Already filtered
  allPeople: PersonProfile[]  // For sphere (show all)
  organizations: OrganizationProfile[]
  onSelectPerson: (person: PersonProfile) => void
  selectedPersonId?: string
  searchQuery?: string
  onSearchChange?: (query: string) => void
  filterOrgId?: string | null
  onFilterOrgChange?: (orgId: string | null) => void
  onClearFilters?: () => void
}

export function PeopleTab({ 
  people, 
  allPeople,
  organizations, 
  onSelectPerson, 
  selectedPersonId,
  searchQuery,
  onSearchChange,
  filterOrgId,
  onFilterOrgChange,
  onClearFilters
}: PeopleTabProps) {
  const hasActiveFilters = !!searchQuery || !!filterOrgId

  // Sphere always shows all people for the full community feel
  const sphereImages: ImageData[] = useMemo(() => {
    return allPeople.slice(0, 50).map(person => ({
      id: person.user_id,
      src: person.avatar_url || "/placeholder.svg",
      alt: person.full_name,
      title: person.full_name,
      description: person.job_title || "",
    }))
  }, [allPeople])

  return (
    <div className="space-y-6">
      {/* Hero Sphere - Main Feature (matching login page exactly) */}
      {sphereImages.length > 0 && (
        <div className="relative flex items-center justify-center w-full py-12 mx-auto">
          <div className="absolute inset-0 max-w-2xl mx-auto blur-[140px] opacity-60 pointer-events-none">
            <div className="w-full h-full rounded-[999px] bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10" />
          </div>
          <SphereImageGrid
            images={sphereImages}
            containerSize={480}
            sphereRadius={230}
            autoRotate
            autoRotateSpeed={0.2}
            dragSensitivity={0.7}
            className="pointer-events-auto relative mx-auto"
            onImageClick={(image) => {
              const person = allPeople.find(p => p.user_id === image.id)
              if (person) onSelectPerson(person)
            }}
          />
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-4 px-4 border-b border-border/40">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people by name, role, or skills..."
            className="pl-9 bg-muted/50 border-border/50 focus:bg-background transition-colors rounded-xl"
            value={searchQuery || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select 
            value={filterOrgId || "all"} 
            onValueChange={(value) => onFilterOrgChange?.(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-muted/50 border-border/50 rounded-xl">
              <SelectValue placeholder="All Organizations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs shrink-0"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <p>
          {people.length === allPeople.length
            ? `Showing all ${allPeople.length} people`
            : `Showing ${people.length} of ${allPeople.length} people`}
        </p>
      </div>

      {/* People Grid */}
      {people.length === 0 ? (
        <Card className="border border-border/50 bg-[var(--surface)] p-8 text-center rounded-3xl">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No people found</h3>
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "No people in the directory yet"}
          </p>
          {hasActiveFilters && onClearFilters && (
            <Button variant="link" onClick={onClearFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {people.map(person => (
            <PersonCard 
              key={person.user_id} 
              person={person} 
              isSelected={person.user_id === selectedPersonId}
              onClick={() => onSelectPerson(person)} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
