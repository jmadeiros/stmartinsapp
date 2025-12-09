"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Building2, Globe, Users, Sparkles, MapPin } from "lucide-react"
import type { PersonProfile, OrganizationProfile } from "@/app/(authenticated)/people/actions"
import { cn } from "@/lib/utils"

interface OrganizationDetailViewProps {
  organization: OrganizationProfile | null
  people: PersonProfile[]
  onSelectPerson: (person: PersonProfile) => void
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

// Map real org names to mock org names for matching
const orgNameMappings: Record<string, string[]> = {
  'St Martin\'s Hub': ['St Martins', 'St Martin\'s Hub'],
  'St Martins': ['St Martins', 'St Martin\'s Hub'],
  'Hope Kitchen': ['Hope Kitchen'],
  'Youth Action Network': ['Youth Forward', 'Youth Action Network'],
  'Youth Forward': ['Youth Forward', 'Youth Action Network'],
  'Community Arts Trust': ['Green Spaces Trust', 'Community Arts Trust'],
  'Green Spaces Trust': ['Green Spaces Trust', 'Community Arts Trust'],
}

export function OrganizationDetailView({ organization, people, onSelectPerson }: OrganizationDetailViewProps) {
  const orgMembers = useMemo(() => {
    if (!organization) return []
    // First try matching by ID
    let members = people.filter(p => p.organization?.id === organization.id)
    // If no members found, try matching by name (for mock data compatibility)
    if (members.length === 0) {
      const nameVariants = orgNameMappings[organization.name] || [organization.name]
      members = people.filter(p => 
        p.organization?.name && nameVariants.includes(p.organization.name)
      )
    }
    return members
  }, [people, organization])

  const teamLead = useMemo(() => {
    return orgMembers.find(p => 
      p.job_title?.toLowerCase().includes('director') || 
      p.job_title?.toLowerCase().includes('head') || 
      p.job_title?.toLowerCase().includes('lead')
    )
  }, [orgMembers])

  if (!organization) {
    return (
      <div className="rounded-3xl border border-dashed border-border/50 bg-[var(--surface)] p-12 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Building2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Select an Organization</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Choose an organization from the sidebar to view their mission, team, and more.
        </p>
      </div>
    )
  }

  const orgColor = organization.primary_color || '#10b981'

  return (
    <div className="space-y-8">
      {/* Team Block - Aligned with provided snippet */}
      <div className="rounded-3xl border border-border/50 bg-[var(--surface)]/80 p-8 shadow-sm backdrop-blur-md transition-all">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-6 flex-1">
            {/* Focus/Category Badge */}
            <Badge 
              variant="secondary" 
              className="w-fit px-3 py-1 text-sm font-medium border-0"
              style={{ backgroundColor: `${orgColor}15`, color: orgColor }}
            >
              {organization.cause_areas?.[0] || 'Community Partner'}
            </Badge>
            
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
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{organization.name}</h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                {organization.mission || organization.description}
              </p>
            </div>

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

          {teamLead && (
            <div className="rounded-2xl bg-muted/30 p-5 min-w-[280px] border border-border/50">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-4">
                Team Lead
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm cursor-pointer transition-transform hover:scale-105" onClick={() => onSelectPerson(teamLead)}>
                  <AvatarImage src={teamLead.avatar_url || undefined} alt={teamLead.full_name} />
                  <AvatarFallback className="bg-background text-foreground font-bold border border-border/50">
                    {getInitials(teamLead.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p 
                    className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onSelectPerson(teamLead)}
                  >
                    {teamLead.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{teamLead.job_title}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-5 w-full gap-2 bg-background hover:bg-muted border border-border/50 shadow-sm transition-all"
                onClick={() => onSelectPerson(teamLead)}
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                View Profile
              </Button>
            </div>
          )}
        </div>

        {/* Member Cards Grid */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Team Members 
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {orgMembers.length}
              </span>
            </h3>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orgMembers.map((member) => (
              <div
                key={member.user_id}
                className="group rounded-xl border border-border/50 bg-[var(--surface)] p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-md cursor-pointer"
                onClick={() => onSelectPerson(member)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-11 w-11 border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                    <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
                    <AvatarFallback className="bg-muted font-semibold text-sm">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">
                      {member.full_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {member.job_title}
                    </p>
                  </div>
                </div>
                
                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.skills.slice(0, 2).map((skill) => (
                      <span key={skill} className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 2 && (
                      <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                        +{member.skills.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
