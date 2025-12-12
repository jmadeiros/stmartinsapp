"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Sparkles, ChevronRight, MessageCircle, FileEdit, CalendarCheck, Trophy, Zap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { HighlightCard } from "@/components/ui/card-5"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface TeamMember {
  name: string
  avatar: string | null
  initials: string
  online: boolean
  role: string | null
  recentActivity: {
    type: "comment" | "post" | "event"
    action: string
    target: string
    time: string
  } | null
}

interface CommunityHighlight {
  title: string
  description: string
  metricValue: string
  metricLabel: string
  icon: React.ReactNode
  color: "orange" | "default" | "blue"
}

interface SocialLeftSidebarProps {
  userName?: string
  userId?: string
  orgId?: string
}

// Helper function to get initials from a name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Helper function to check if user is "online" (active within last 15 minutes)
function isOnline(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false
  const lastActive = new Date(lastActiveAt)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  return lastActive > fifteenMinutesAgo
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function SocialLeftSidebar({ userName = "Michael", userId, orgId }: SocialLeftSidebarProps) {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // State for real data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [totalTeamCount, setTotalTeamCount] = useState(0)
  const [orgName, setOrgName] = useState<string>("Your Organization")

  // State for community highlights
  const [communityHighlights, setCommunityHighlights] = useState<CommunityHighlight[]>([])
  const [highlightsLoading, setHighlightsLoading] = useState(true)

  // Fetch team members from user's organization
  useEffect(() => {
    async function fetchTeamMembers() {
      if (!orgId) {
        setTeamLoading(false)
        return
      }

      const supabase = createClient()

      try {
        // First, get the organization name
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', orgId)
          .single()

        if (orgData) {
          setOrgName((orgData as { name: string }).name)
        }

        // Fetch team members from user_profiles filtered by organization
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('organization_id', orgId)
          .order('last_active_at', { ascending: false, nullsFirst: false })
          .limit(10)

        if (error) {
          console.error('Error fetching team members:', error)
          setTeamLoading(false)
          return
        }

        // Get total count for the "+X" badge
        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)

        setTotalTeamCount(count || 0)

        // Transform profiles to TeamMember format
        const members: TeamMember[] = (profiles || []).slice(0, 4).map((profile: UserProfile) => ({
          name: profile.full_name,
          avatar: profile.avatar_url,
          initials: getInitials(profile.full_name),
          online: isOnline(profile.last_active_at),
          role: profile.job_title,
          recentActivity: null // We could fetch recent activity separately if needed
        }))

        setTeamMembers(members)
      } catch (err) {
        console.error('Error fetching team data:', err)
      } finally {
        setTeamLoading(false)
      }
    }

    fetchTeamMembers()
  }, [orgId])

  // Fetch community highlights (building-wide metrics)
  useEffect(() => {
    async function fetchCommunityHighlights() {
      const supabase = createClient()

      try {
        // Get start and end of current week
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)

        // Count events this week (building-wide)
        const { count: eventsThisWeek } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gte('start_time', startOfWeek.toISOString())
          .lt('start_time', endOfWeek.toISOString())
          .is('deleted_at', null)

        // Count active projects (building-wide)
        const { count: activeProjects } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .is('deleted_at', null)

        // Count pinned posts (building-wide)
        const { count: pinnedPosts } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('is_pinned', true)
          .is('deleted_at', null)

        // Build highlights with real data
        const highlights: CommunityHighlight[] = [
          {
            title: "Events This Week",
            description: eventsThisWeek && eventsThisWeek > 0
              ? `${eventsThisWeek} event${eventsThisWeek !== 1 ? 's' : ''} happening across the building this week. Check the calendar to join!`
              : "No events scheduled this week yet. Be the first to create one!",
            metricValue: String(eventsThisWeek || 0),
            metricLabel: eventsThisWeek === 1 ? "event" : "events",
            icon: <Trophy className="h-6 w-6" fill="currentColor" />,
            color: "orange" as const,
          },
          {
            title: "Active Projects",
            description: activeProjects && activeProjects > 0
              ? `${activeProjects} collaborative project${activeProjects !== 1 ? 's' : ''} currently in progress. See how you can contribute!`
              : "No active projects at the moment. Start a new initiative!",
            metricValue: String(activeProjects || 0),
            metricLabel: activeProjects === 1 ? "project" : "projects",
            icon: <Zap className="h-6 w-6" fill="currentColor" />,
            color: "default" as const,
          },
          {
            title: "Pinned Highlights",
            description: pinnedPosts && pinnedPosts > 0
              ? `${pinnedPosts} important post${pinnedPosts !== 1 ? 's' : ''} pinned by community leaders. Don't miss these updates!`
              : "No pinned posts right now. Check back soon for important announcements.",
            metricValue: String(pinnedPosts || 0),
            metricLabel: pinnedPosts === 1 ? "pinned" : "pinned",
            icon: <Users className="h-6 w-6" fill="currentColor" />,
            color: "blue" as const,
          },
        ]

        setCommunityHighlights(highlights)
      } catch (err) {
        console.error('Error fetching community highlights:', err)
        // Set fallback highlights on error
        setCommunityHighlights([
          {
            title: "Community Pulse",
            description: "Check back soon for live community metrics and highlights.",
            metricValue: "",
            metricLabel: "",
            icon: <Trophy className="h-6 w-6" fill="currentColor" />,
            color: "orange" as const,
          },
        ])
      } finally {
        setHighlightsLoading(false)
      }
    }

    fetchCommunityHighlights()
  }, [])

  // Carousel rotation effect
  useEffect(() => {
    if (communityHighlights.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % communityHighlights.length)
    }, 30000) // Rotate every 30 seconds

    return () => clearInterval(interval)
  }, [communityHighlights.length])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "comment":
        return MessageCircle
      case "post":
        return FileEdit
      case "event":
        return CalendarCheck
      default:
        return FileEdit
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "comment":
        return "bg-blue-500"
      case "post":
        return "bg-emerald-500"
      case "event":
        return "bg-purple-500"
      default:
        return "bg-primary"
    }
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
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
              <Avatar className="h-16 w-16 mb-4 ring-4 ring-white/30 shadow-lg">
                <AvatarImage src="/placeholder.svg?height=64&width=64" alt="MG" />
                <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">MG</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-white text-balance leading-tight">Good morning,</h2>
              <p className="text-xl font-semibold text-white/95">{userName}</p>
            </div>
          </Card>
        </motion.div>

        {/* My Team Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            className="border border-border/50 bg-[var(--surface)] p-4 py-4"
            style={{ boxShadow: "var(--shadow-surface)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">My Team</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4 text-center">{orgName}</p>

            <div className="flex justify-center -space-x-2.5 mb-4">
              {teamLoading ? (
                <div className="flex items-center justify-center h-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : teamMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No team members found</p>
              ) : (
                <>
                  {teamMembers.map((member, index) => {
                    const ActivityIcon = member.recentActivity ? getActivityIcon(member.recentActivity.type) : null
                    return (
                      <div
                        key={index}
                        className="relative"
                        onMouseEnter={() => setHoveredMember(index)}
                        onMouseLeave={() => setHoveredMember(null)}
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-card hover:z-20 transition-all hover:scale-110 cursor-pointer">
                          <AvatarImage src={member.avatar || undefined} alt={member.name} />
                          <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">{member.initials}</AvatarFallback>
                        </Avatar>

                        {/* Online indicator */}
                        {member.online && (
                          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-card z-10" />
                        )}

                        {/* Activity badge */}
                        {member.recentActivity && ActivityIcon && (
                          <div className={cn(
                            "absolute -top-0.5 -left-0.5 h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-card z-10",
                            getActivityColor(member.recentActivity.type)
                          )}>
                            <ActivityIcon className="h-3 w-3 text-white" />
                          </div>
                        )}

                        {/* Hover tooltip */}
                        <AnimatePresence>
                          {hoveredMember === index && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none"
                            >
                              <div className="bg-card border border-border shadow-lg rounded-lg p-3 min-w-[180px]">
                                <p className="text-xs font-semibold text-foreground mb-1">{member.name}</p>
                                {member.role && (
                                  <p className="text-[11px] text-muted-foreground">{member.role}</p>
                                )}
                                {member.online && (
                                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Online now
                                  </p>
                                )}
                                {member.recentActivity && ActivityIcon && (
                                  <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border">
                                    <ActivityIcon className={cn(
                                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                                      member.recentActivity.type === "comment" && "text-blue-500",
                                      member.recentActivity.type === "post" && "text-emerald-500",
                                      member.recentActivity.type === "event" && "text-purple-500"
                                    )} />
                                    <div className="flex-1">
                                      <p className="text-xs text-muted-foreground leading-tight">
                                        {member.recentActivity.action}{" "}
                                        <span className="font-medium text-foreground">{member.recentActivity.target}</span>
                                      </p>
                                      <p className="text-[11px] text-muted-foreground mt-1">{member.recentActivity.time}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* Tooltip arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                <div className="border-4 border-transparent border-t-border" />
                                <div className="border-4 border-transparent border-t-card absolute top-0 left-1/2 -translate-x-1/2 -mt-px" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                  {totalTeamCount > 4 && (
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted ring-2 ring-card text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
                      +{totalTeamCount - 4}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <button className="w-full text-xs text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-muted/40 mt-2">
              <span>See all team members</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </Card>
        </motion.div>

        {/* Community Highlights Carousel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: 'oklch(0.52 0.12 166 / 0.1)' }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Community Highlights</h3>
              <p className="text-xs text-muted-foreground">Live metrics from across the building</p>
            </div>
          </div>

          <div className="relative h-52">
            {highlightsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : communityHighlights.length === 0 ? (
              <Card className="h-full flex items-center justify-center p-4">
                <p className="text-sm text-muted-foreground text-center">No highlights available</p>
              </Card>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0"
                >
                  <HighlightCard
                    title={communityHighlights[currentIndex]?.title || ""}
                    description={communityHighlights[currentIndex]?.description || ""}
                    metricValue={communityHighlights[currentIndex]?.metricValue || ""}
                    metricLabel={communityHighlights[currentIndex]?.metricLabel || ""}
                    buttonText="View"
                    onButtonClick={() => console.log(`Clicked ${communityHighlights[currentIndex]?.title}`)}
                    icon={communityHighlights[currentIndex]?.icon}
                    color={communityHighlights[currentIndex]?.color || "default"}
                    className="w-full h-full"
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
