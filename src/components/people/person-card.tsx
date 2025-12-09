"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { PersonProfile } from "@/app/(authenticated)/people/actions"
import { cn } from "@/lib/utils"

interface PersonCardProps {
  person: PersonProfile
  isSelected?: boolean
  onClick: () => void
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function getRoleLabel(role: string | null): string {
  const labels: Record<string, string> = {
    admin: "Admin",
    st_martins_staff: "Staff",
    partner_staff: "Partner",
    volunteer: "Volunteer",
  }
  return role ? labels[role] || role : ""
}

export function PersonCard({ person, isSelected, onClick }: PersonCardProps) {
  const orgColor = person.organization?.primary_color || "#10b981"

  return (
    <Card
      className={cn(
        "group p-4 cursor-pointer transition-all duration-200 border border-border/50 bg-[var(--surface)]",
        isSelected 
          ? "ring-2 ring-primary/50 border-primary/30" 
          : "hover:shadow-lg hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className={cn(
          "h-12 w-12 border-2 shadow-sm transition-all",
          isSelected ? "border-primary/50" : "border-background"
        )}>
          <AvatarImage src={person.avatar_url || undefined} alt={person.full_name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(person.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-sm truncate transition-colors",
            isSelected ? "text-primary" : "group-hover:text-primary"
          )}>
            {person.full_name}
          </h3>
          {person.job_title && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{person.job_title}</p>
          )}
        </div>
      </div>
      {person.organization && (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: orgColor }} />
          <span className="text-xs text-muted-foreground truncate">{person.organization.name}</span>
          {person.role && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
              {getRoleLabel(person.role)}
            </Badge>
          )}
        </div>
      )}
      {person.skills && person.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {person.skills.slice(0, 3).map(skill => (
            <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50">
              {skill}
            </Badge>
          ))}
          {person.skills.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{person.skills.length - 3}</span>
          )}
        </div>
      )}
    </Card>
  )
}
