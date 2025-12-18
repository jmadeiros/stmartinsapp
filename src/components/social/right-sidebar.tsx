"use client"

import { useState, useEffect, useCallback } from "react"
import { Zap, AlertTriangle, Plus, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

import { AnimatedEvents } from "./animated-events"
import { SendAlertDialog } from "./send-alert-dialog"
import { createAlert } from "@/lib/actions/alerts"
import { acknowledgePost, hasUserAcknowledged, getPostAcknowledgments } from "@/lib/actions/posts"

type UserRole = 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'

interface PriorityAlert {
  id: string
  title: string | null
  content: string
  category: string
  created_at: string
  author: {
    full_name: string
    job_title: string | null
    avatar_url: string | null
  }
  acknowledgment_count: number
  has_acknowledged: boolean
}

interface SocialRightSidebarProps {
  userId?: string
  orgId?: string
  userRole?: UserRole
}

// Helper to format relative time
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return date.toLocaleDateString()
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function SocialRightSidebar({ userId, orgId, userRole = 'volunteer' }: SocialRightSidebarProps) {
  const [priorityAlerts, setPriorityAlerts] = useState<PriorityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [isCreatingAlert, setIsCreatingAlert] = useState(false)

  // Check if user can send alerts
  const canSendAlerts = userRole === 'admin' || userRole === 'st_martins_staff'

  // Fetch priority alert posts from Supabase
  const fetchPriorityAlerts = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      // Fetch pinned posts as priority alerts
      let query = (supabase
        .from("posts") as any)
        .select(`
          id,
          title,
          content,
          category,
          created_at,
          author_id,
          is_pinned
        `)
        .eq("is_pinned", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      // Filter by org if provided
      if (orgId) {
        query = query.eq("org_id", orgId)
      }

      const { data: postsData, error: postsError } = await query

      if (postsError) {
        console.error("Error fetching priority alerts:", postsError)
        setLoading(false)
        return
      }

      type PostRow = {
        id: string
        title: string | null
        content: string
        category: string
        created_at: string
        author_id: string
        is_pinned: boolean
      }

      const posts = (postsData || []) as PostRow[]

      // Fetch author profiles
      const authorIds = Array.from(new Set(posts.map(p => p.author_id)))
      let authorMap: Record<string, { full_name: string; job_title: string | null; avatar_url: string | null }> = {}

      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, full_name, job_title, avatar_url")
          .in("user_id", authorIds)

        if (profiles) {
          type ProfileRow = { user_id: string; full_name: string; job_title: string | null; avatar_url: string | null }
          authorMap = (profiles as ProfileRow[]).reduce((acc, profile) => {
            acc[profile.user_id] = {
              full_name: profile.full_name,
              job_title: profile.job_title,
              avatar_url: profile.avatar_url,
            }
            return acc
          }, {} as typeof authorMap)
        }
      }

      // For each post, check if current user has acknowledged and get acknowledgment count
      const alertsWithAcknowledgments = await Promise.all(
        posts.map(async (post) => {
          const { data: hasAcked } = await hasUserAcknowledged(post.id, userId)
          const { data: ackData } = await getPostAcknowledgments(post.id)

          return {
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category,
            created_at: post.created_at,
            author: authorMap[post.author_id] || {
              full_name: "Unknown",
              job_title: null,
              avatar_url: null,
            },
            acknowledgment_count: ackData?.count || 0,
            has_acknowledged: hasAcked || false,
          }
        })
      )

      setPriorityAlerts(alertsWithAcknowledgments)
    } catch (err) {
      console.error("Error in fetchPriorityAlerts:", err)
    } finally {
      setLoading(false)
    }
  }, [orgId, userId])

  // Fetch priority alerts on mount and when userId changes
  useEffect(() => {
    fetchPriorityAlerts()
  }, [fetchPriorityAlerts])

  const handleAcknowledge = async (postId: string) => {
    const result = await acknowledgePost(postId)
    if (result.success) {
      // Refresh the alerts to update acknowledgment status
      await fetchPriorityAlerts()
    } else {
      console.error("Failed to acknowledge post:", result.error)
    }
  }

  const handleSendAlert = async (alertData: {
    priority: "high" | "medium"
    title: string
    message: string
    audience: string
  }) => {
    if (!userId) {
      console.error("User ID is required to send alerts")
      return
    }

    setIsCreatingAlert(true)

    try {
      const result = await createAlert({
        title: alertData.title,
        message: alertData.message,
        severity: alertData.priority,
        createdBy: userId,
        orgId: orgId,
      })

      if (result.success) {
        // Refetch priority alerts to show the new one
        await fetchPriorityAlerts()
        setShowAlertDialog(false)
      } else {
        console.error("Failed to create alert:", result.error)
      }
    } catch (err) {
      console.error("Error creating alert:", err)
    } finally {
      setIsCreatingAlert(false)
    }
  }

  // Filter out already acknowledged alerts
  const visibleAlerts = priorityAlerts.filter(alert => !alert.has_acknowledged)
  const currentAlert = visibleAlerts[0] // Show the most recent non-acknowledged alert

  // Determine priority styling based on category
  const getPriorityStyles = (category: string) => {
    // High priority for wins and intros
    if (category === "wins" || category === "intros") {
      return {
        headerBg: "bg-destructive",
        headerText: "text-destructive-foreground",
        buttonBg: "bg-destructive hover:bg-destructive/90",
        icon: Zap,
        label: "Priority"
      }
    }
    // Medium priority for other categories
    return {
      headerBg: "bg-amber-500",
      headerText: "text-white",
      buttonBg: "bg-amber-500 hover:bg-amber-600",
      icon: AlertTriangle,
      label: "Alert"
    }
  }

  return (
    <aside className="hidden space-y-4 lg:block">
      <div className="sticky top-24 space-y-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border border-border/50 bg-[var(--surface)] overflow-hidden p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </Card>
            </motion.div>
          ) : currentAlert ? (
            <motion.div
              key={`priority-alert-${currentAlert.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4 }}
            >
              {(() => {
                const styles = getPriorityStyles(currentAlert.category)
                const IconComponent = styles.icon
                const authorName = currentAlert.author.full_name
                const authorRole = currentAlert.author.job_title || "Team Member"
                const authorAvatar = currentAlert.author.avatar_url

                return (
                  <Card className="border border-border/50 bg-[var(--surface)] overflow-hidden p-0" style={{ boxShadow: "var(--shadow-overlay)" }}>
                    <div className={`${styles.headerBg} px-4 py-2.5 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 ${styles.headerText}`} fill="currentColor" />
                        <span className={`text-sm font-semibold ${styles.headerText}`}>
                          {styles.label}
                        </span>
                      </div>
                      <span className={`text-xs ${styles.headerText}/90 font-medium`}>
                        {formatTimeAgo(currentAlert.created_at)}
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-border/50">
                          <AvatarImage src={authorAvatar || "/placeholder.svg"} alt={authorName} />
                          <AvatarFallback className="bg-muted text-foreground font-semibold">
                            {getInitials(authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{authorName}</p>
                          <p className="text-xs text-muted-foreground">{authorRole}</p>
                        </div>
                      </div>

                      <div>
                        {currentAlert.title && (
                          <h3 className="text-base font-bold text-foreground mb-2 leading-tight">
                            {currentAlert.title}
                          </h3>
                        )}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {currentAlert.content}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={() => handleAcknowledge(currentAlert.id)}
                          className={`w-full ${styles.buttonBg} text-white border-0 shadow-sm transition-all active:scale-[0.98]`}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>

                        {currentAlert.acknowledgment_count > 0 && (
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{currentAlert.acknowledgment_count} {currentAlert.acknowledgment_count === 1 ? 'person' : 'people'} acknowledged</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })()}
            </motion.div>
          ) : (
            <motion.div
              key="events-carousel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatedEvents className="border border-border/50 bg-[var(--surface)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send Alert Button for Staff/Admin */}
        {canSendAlerts && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Button
              onClick={() => setShowAlertDialog(true)}
              variant="outline"
              className="w-full gap-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
            >
              <Plus className="h-4 w-4" />
              Send Alert
            </Button>
          </motion.div>
        )}

        {/* Show count of other alerts if more than one */}
        {visibleAlerts.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground">
              +{visibleAlerts.length - 1} more alert{visibleAlerts.length > 2 ? "s" : ""}
            </p>
          </motion.div>
        )}
      </div>

      {/* Send Alert Dialog */}
      <SendAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        onSend={handleSendAlert}
      />
    </aside>
  )
}
