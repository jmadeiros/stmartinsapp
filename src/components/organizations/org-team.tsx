"use client"

import { useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import Link from "next/link"
import { Database } from "@/lib/database.types"

interface OrgTeamProps {
  members: {
    user_id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    role: Database['public']['Enums']['user_role']
  }[]
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function getRoleBadge(role: Database['public']['Enums']['user_role']) {
  const roleLabels = {
    admin: 'Admin',
    st_martins_staff: 'Manager',
    partner_staff: 'Staff',
    volunteer: 'Volunteer',
  }
  return roleLabels[role] || role
}

export function OrgTeam({ members }: OrgTeamProps) {
  // Sort members: admins first, then st_martins_staff, then others
  const sortedMembers = useMemo(() => {
    const roleOrder = { admin: 0, st_martins_staff: 1, partner_staff: 2, volunteer: 3 }
    return [...members].sort((a, b) => {
      const aOrder = roleOrder[a.role] ?? 4
      const bOrder = roleOrder[b.role] ?? 4
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.full_name.localeCompare(b.full_name)
    })
  }, [members])

  // Find team lead (first admin or st_martins_staff with director/head/lead in title)
  const teamLead = useMemo(() => {
    return sortedMembers.find(m =>
      (m.role === 'admin' || m.role === 'st_martins_staff') &&
      m.job_title &&
      (m.job_title.toLowerCase().includes('director') ||
       m.job_title.toLowerCase().includes('head') ||
       m.job_title.toLowerCase().includes('lead'))
    ) || sortedMembers.find(m => m.role === 'admin' || m.role === 'st_martins_staff')
  }, [sortedMembers])

  return (
    <Card className="border-border/50 bg-[var(--surface)]/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members
          <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-1">
            {members.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Team Lead Highlight */}
        {teamLead && (
          <div className="rounded-2xl bg-muted/30 p-5 mb-6 border border-border/50">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-4">
              Team Lead
            </p>
            <Link href={`/profile/${teamLead.user_id}`} className="block">
              <div className="flex items-center gap-4 group cursor-pointer">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={teamLead.avatar_url || undefined} alt={teamLead.full_name} />
                  <AvatarFallback className="bg-background text-foreground font-bold border border-border/50">
                    {getInitials(teamLead.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {teamLead.full_name}
                  </p>
                  {teamLead.job_title && (
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {teamLead.job_title}
                    </p>
                  )}
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {getRoleBadge(teamLead.role)}
                  </Badge>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* All Team Members Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedMembers.map((member) => (
            <Link
              key={member.user_id}
              href={`/profile/${member.user_id}`}
              className="group rounded-xl border border-border/50 bg-[var(--surface)] p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-11 w-11 border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
                  <AvatarFallback className="bg-muted font-semibold text-sm">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {member.full_name}
                  </h3>
                  {member.job_title && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {member.job_title}
                    </p>
                  )}
                </div>
              </div>

              <Badge variant="outline" className="text-[10px] border-border/50">
                {getRoleBadge(member.role)}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
