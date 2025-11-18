"use client"

import { useState, useEffect } from "react"
import { Users, Sparkles, ChevronRight, MessageCircle, FileEdit, CalendarCheck, CheckCircle2, Trophy, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { HighlightCard } from "@/components/ui/card-5"

// Mock data - in production this would come from your backend
const teamMembers = [
  { 
    name: "Sarah Johnson", 
    avatar: "/placeholder.svg?height=40&width=40", 
    initials: "SJ", 
    online: true,
    recentActivity: {
      type: "comment",
      action: "commented on",
      target: "Community Garden project",
      time: "2m ago"
    }
  },
  { 
    name: "David Lee", 
    avatar: "/placeholder.svg?height=40&width=40", 
    initials: "DL", 
    online: true,
    recentActivity: {
      type: "post",
      action: "posted in",
      target: "#wins",
      time: "15m ago"
    }
  },
  { 
    name: "Emma Wilson", 
    avatar: "/placeholder.svg?height=40&width=40", 
    initials: "EW", 
    online: false,
    recentActivity: null
  },
  { 
    name: "James Chen", 
    avatar: "/placeholder.svg?height=40&width=40", 
    initials: "JC", 
    online: true,
    recentActivity: {
      type: "event",
      action: "RSVP'd to",
      target: "Food Drive event",
      time: "1h ago"
    }
  },
]

const communityHighlights = [
  {
    title: "Collaboration Pulse",
    description: "12 cross-team collisions were launched from last week's posts, with Community Garden leading the momentum.",
    metricValue: "",
    metricLabel: "",
    icon: <Trophy className="h-6 w-6" fill="currentColor" />,
    color: "orange" as const,
  },
  {
    title: "Project Signals",
    description: "Eight active initiatives shared updates this month. Community Garden hit 67% of its funding goal.",
    metricValue: "",
    metricLabel: "",
    icon: <Zap className="h-6 w-6" fill="currentColor" />,
    color: "default" as const,
  },
  {
    title: "Events Momentum",
    description: "Food Drive RSVPs passed 200 while Charity Run prep posts drove the highest engagement this week.",
    metricValue: "",
    metricLabel: "",
    icon: <Users className="h-6 w-6" fill="currentColor" />,
    color: "blue" as const,
  },
]

interface SocialLeftSidebarProps {
  userName?: string
}

export function SocialLeftSidebar({ userName = "Michael" }: SocialLeftSidebarProps) {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % communityHighlights.length)
    }, 30000) // Rotate every 30 seconds

    return () => clearInterval(interval)
  }, [])

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
            className="border border-border/50 bg-[var(--surface)] p-3 py-2.5"
            style={{ boxShadow: "var(--shadow-surface)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">My Team</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-3 text-center">Hope Foundation</p>
            
            <div className="flex justify-center -space-x-2.5 mb-3">
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
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">{member.initials}</AvatarFallback>
                    </Avatar>
                    
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
                      {hoveredMember === index && member.recentActivity && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none"
                        >
                          <div className="bg-card border border-border shadow-lg rounded-lg p-3 min-w-[200px]">
                            <p className="text-xs font-semibold text-foreground mb-1">{member.name}</p>
                            <div className="flex items-start gap-2">
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
                            <button className="mt-2 text-[11px] text-primary hover:text-primary/80 font-medium">
                              View →
                            </button>
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
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted ring-2 ring-card text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
                +8
              </div>
            </div>
            
            <button className="w-full text-xs text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-muted/40 mt-1">
              <span>See all team members</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </Card>
        </motion.div>

        {/* Community Highlights Carousel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Community Highlights</h3>
              <p className="text-xs text-muted-foreground">AI-powered insights from your network</p>
            </div>
          </div>

          <div className="relative h-52">
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
                  title={communityHighlights[currentIndex].title}
                  description={communityHighlights[currentIndex].description}
                  metricValue={communityHighlights[currentIndex].metricValue}
                  metricLabel={communityHighlights[currentIndex].metricLabel}
                  buttonText="View"
                  onButtonClick={() => console.log(`Clicked ${communityHighlights[currentIndex].title}`)}
                  icon={communityHighlights[currentIndex].icon}
                  color={communityHighlights[currentIndex].color}
                  className="w-full h-full"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </aside>
  )
}
