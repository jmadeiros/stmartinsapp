"use client"

import { useMemo } from "react"
import { Users, Building2, ChevronRight, Sparkles, TrendingUp, Briefcase, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PersonProfile, OrganizationProfile } from "@/app/(authenticated)/people/actions"
import { cn } from "@/lib/utils"

interface PeopleLeftSidebarProps {
  people: PersonProfile[]
  organizations: OrganizationProfile[]
  activeTab: "people" | "organizations"
  selectedOrgId: string | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectOrg: (org: OrganizationProfile | null) => void
  onSelectPerson: (person: PersonProfile) => void
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function PeopleLeftSidebar({ 
  people, 
  organizations, 
  activeTab,
  selectedOrgId,
  searchQuery,
  onSearchChange,
  onSelectOrg,
  onSelectPerson 
}: PeopleLeftSidebarProps) {
  
  const stats = useMemo(() => {
    const roles = people.reduce((acc, p) => {
      if (p.role) acc[p.role] = (acc[p.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return {
      totalPeople: people.length,
      totalOrgs: organizations.length,
      staff: (roles['st_martins_staff'] || 0) + (roles['partner_staff'] || 0),
      volunteers: roles['volunteer'] || 0,
    }
  }, [people, organizations])

  const recentlyActive = useMemo(() => people.slice(0, 4), [people])

  // Organizations tab - show org picker
  if (activeTab === "organizations") {
    return (
      <aside className="hidden lg:block space-y-4">
        <div className="sticky top-24 space-y-4">
          {/* Page Header Card */}
          <Card
            className="border-0 p-6 overflow-hidden relative"
            style={{
              boxShadow: "var(--shadow-card)",
              backgroundImage:
                "linear-gradient(135deg, oklch(0.6 0.118 184.704), oklch(0.52 0.12 166 / 0.8), oklch(0.769 0.188 70.08))",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white text-balance leading-tight">Organizations</h1>
              <p className="text-sm text-white/80 mt-1">Directory</p>
              <p className="text-xs text-white/60 mt-3">{stats.totalOrgs} partner organizations</p>
            </div>
          </Card>

          {/* Organizations List */}
          <Card className="border border-border/50 bg-[var(--surface)] p-4" style={{ boxShadow: "var(--shadow-surface)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Select Organization</h3>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-1">
              {organizations.map(org => {
                const isSelected = selectedOrgId === org.id
                
                return (
                  <button
                    key={org.id}
                    onClick={() => onSelectOrg(isSelected ? null : org)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Avatar 
                      className="h-7 w-7 rounded-lg border border-border/30"
                      style={{ backgroundColor: org.primary_color || '#10b981' }}
                    >
                      {org.logo_url ? (
                        <AvatarImage src={org.logo_url} className="object-contain p-0.5" />
                      ) : (
                        <AvatarFallback className="bg-transparent text-white font-semibold rounded-lg text-[10px]">
                          {getInitials(org.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{org.name}</span>
                      <span className="text-[10px] text-muted-foreground">{org.member_count} members</span>
                    </div>
                    {isSelected && (
                      <ChevronRight className="h-4 w-4 text-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      </aside>
    )
  }

  // People tab - show search, org filter, and recently active
  return (
    <aside className="hidden lg:block space-y-4">
      <div className="sticky top-24 space-y-4">
        {/* Page Header Card */}
        <Card
          className="border-0 p-6 overflow-hidden relative"
          style={{
            boxShadow: "var(--shadow-card)",
            backgroundImage:
              "linear-gradient(135deg, oklch(0.6 0.118 184.704), oklch(0.52 0.12 166 / 0.8), oklch(0.769 0.188 70.08))",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white text-balance leading-tight">People</h1>
            <p className="text-sm text-white/80 mt-1">Directory</p>
            <p className="text-xs text-white/60 mt-3">{stats.totalPeople} community members</p>
          </div>
        </Card>

        {/* Recently Active */}
        <Card className="border border-border/50 bg-[var(--surface)] p-4" style={{ boxShadow: "var(--shadow-surface)" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recently Active</h3>
          </div>
          <div className="space-y-2">
            {recentlyActive.map(person => (
              <div
                key={person.user_id}
                className="group flex items-center gap-3 p-2 -mx-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-all"
                onClick={() => onSelectPerson(person)}
              >
                <Avatar className="h-8 w-8 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
                  <AvatarImage src={person.avatar_url || undefined} alt={person.full_name} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                    {getInitials(person.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{person.full_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{person.organization?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </aside>
  )
}
