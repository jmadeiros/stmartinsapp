"use client"

import { useEffect, useState, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Linkedin, Mail, MessageCircle, X, Users, Sparkles, Heart, Calendar, Briefcase, ChevronDown, ChevronUp } from "lucide-react"
import type { PersonProfile, RecentActivity } from "@/app/(authenticated)/people/actions"
import { getPersonActivity } from "@/app/(authenticated)/people/actions"
import { format } from "date-fns"

interface PersonInfoPanelProps {
  person: PersonProfile | null
  allPeople?: PersonProfile[]
  onClose: () => void
  onSelectPerson?: (person: PersonProfile) => void
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function PersonInfoPanel({ person, allPeople = [], onClose, onSelectPerson }: PersonInfoPanelProps) {
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (person?.user_id) {
      setIsLoadingActivity(true)
      getPersonActivity(person.user_id)
        .then(setRecentActivity)
        .catch(() => setRecentActivity([]))
        .finally(() => setIsLoadingActivity(false))
    } else {
      setRecentActivity([])
    }
  }, [person?.user_id])

  // Reset expanded state when person changes
  useEffect(() => {
    setIsExpanded(false)
  }, [person?.user_id])

  // Find colleagues from same organization
  const colleagues = useMemo(() => {
    if (!person?.organization?.id || allPeople.length === 0) return []
    return allPeople
      .filter(p => p.organization?.id === person.organization?.id && p.user_id !== person.user_id)
      .slice(0, 6)
  }, [person, allPeople])

  if (!person) {
    return (
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="rounded-3xl border border-border/50 bg-[var(--surface)]/50 p-8 text-center backdrop-blur-sm">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold mb-2">Select a Person</h3>
            <p className="text-sm text-muted-foreground">
              Click on anyone in the sphere or the grid below to see their profile.
            </p>
          </div>
        </div>
      </aside>
    )
  }

  const orgColor = person.organization?.primary_color || '#10b981'

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        {/* Single Unified Panel */}
        <div className="rounded-3xl border border-border/50 bg-[var(--surface)] shadow-lg shadow-black/5 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-2.5 border-b border-border/50 flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: orgColor }} />
            <Badge 
              className="text-[10px] font-bold uppercase tracking-wider border-0 relative z-10"
              style={{ backgroundColor: `${orgColor}15`, color: orgColor }}
            >
              {person.organization?.name || 'Village Member'}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7 relative z-10 hover:bg-black/5" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Avatar & Name */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-16 w-16 mb-2 ring-4 ring-background shadow-lg">
                <AvatarImage src={person.avatar_url || undefined} alt={person.full_name} />
                <AvatarFallback className="bg-muted text-foreground text-lg font-bold">
                  {getInitials(person.full_name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-base font-bold text-foreground">{person.full_name}</h2>
              <p className="text-xs text-muted-foreground">{person.job_title}</p>
              {person.bio && (
                <p className={`text-xs text-muted-foreground leading-relaxed mt-2 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                  {person.bio}
                </p>
              )}
            </div>
          </div>

          {/* Team - Colleagues (Moved Higher) */}
          {colleagues.length > 0 && (
            <div className="px-5 py-3 border-t border-border/30">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold mb-2 flex items-center gap-1">
                <Users className="h-3 w-3" /> Team at {person.organization?.name}
              </h4>
              <div className="flex items-center gap-1.5">
                {colleagues.map(colleague => (
                  <div 
                    key={colleague.user_id} 
                    className="group relative cursor-pointer"
                    onClick={() => onSelectPerson?.(colleague)}
                  >
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm ring-1 ring-border/30 group-hover:ring-primary/40 group-hover:scale-110 transition-all">
                      <AvatarImage src={colleague.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] font-medium">{getInitials(colleague.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-lg">
                        {colleague.full_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connect Actions */}
          {(person.linkedin_url || person.contact_email) && (
            <div className="px-5 py-2.5 border-t border-border/30 flex gap-2">
              {person.linkedin_url && (
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 border-border/50 text-xs h-7 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200" asChild>
                  <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-3 w-3" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {person.contact_email && (
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 border-border/50 text-xs h-7 hover:bg-muted/50" asChild>
                  <a href={`mailto:${person.contact_email}`}>
                    <Mail className="h-3 w-3" />
                    Email
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Expandable Section */}
          {isExpanded && (
            <>
              {/* Skills & Interests */}
              {((person.skills && person.skills.length > 0) || (person.interests && person.interests.length > 0)) && (
                <div className="px-5 py-3 border-t border-border/30 space-y-3">
                  {person.skills && person.skills.length > 0 && (
                    <div>
                      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold mb-1.5 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Skills
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {person.skills.map(skill => (
                          <Badge key={skill} variant="secondary" className="text-[10px] bg-muted/50 px-2 py-0">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {person.interests && person.interests.length > 0 && (
                    <div>
                      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold mb-1.5 flex items-center gap-1">
                        <Heart className="h-3 w-3" /> Interests
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {person.interests.map(interest => (
                          <Badge key={interest} variant="outline" className="text-[10px] border-border/50 px-2 py-0">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Involved In - Events & Projects */}
              <div className="px-5 py-3 border-t border-border/30">
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold mb-2 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Involved In
                </h4>
                {isLoadingActivity ? (
                  <div className="space-y-1.5">
                    <div className="h-8 bg-muted/30 rounded-lg animate-pulse" />
                    <div className="h-8 bg-muted/30 rounded-lg animate-pulse" />
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-1.5">
                    {recentActivity.slice(0, 3).map(activity => (
                      <div 
                        key={activity.id} 
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className={`p-1.5 rounded shrink-0 ${
                          activity.type === 'event' 
                            ? 'bg-amber-500/10 text-amber-600' 
                            : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {activity.type === 'event' ? (
                            <Calendar className="h-3.5 w-3.5" />
                          ) : (
                            <Briefcase className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{activity.title}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {activity.type === 'event' ? 'Event' : 'Project'} · {format(new Date(activity.created_at), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">No recent activity</p>
                )}
              </div>
            </>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-5 py-2.5 border-t border-border/30 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                View full profile
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
