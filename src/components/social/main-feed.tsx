"use client"

import { cn } from "@/lib/utils"
import { PostCard } from "@/components/social/post-card"
import { EventCard } from "@/components/social/event-card"
import { ProjectCard } from "@/components/social/project-card"
import { CreateEventDialog } from "@/components/social/create-event-dialog"
import { CreateProjectDialog } from "@/components/social/create-project-dialog"
import { SendAlertDialog } from "@/components/social/send-alert-dialog"
import { CreatePollDialog } from "@/components/social/create-poll-dialog"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WeeklyUpdateDialog } from "@/components/social/weekly-update-dialog"
import { Sparkles, Send, Image as ImageIcon, Smile, Calendar, Target, BarChart3, Paperclip, Tag, X, Plus, AlertTriangle, Loader2, User, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { FeedItem, FilterType, PostCategory } from "@/lib/types"
import { CategorySelector } from "@/components/ui/category-selector"
import { createPost } from "@/lib/actions/posts"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const filterOptions: FilterType[] = ["All", "Events", "Projects", "Posts"]
const sortOptions = ["Latest", "Shared by", "Shared with"]

type UserRole = 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'

// Type for user profiles in mention dropdown
type UserProfile = {
  user_id: string
  full_name: string
  avatar_url?: string | null
  job_title?: string | null
  organization_name?: string | null
}

// Type for mentionable items (now includes users)
type MentionableItem = {
  id: string
  title: string
  type: 'event' | 'project' | 'organization' | 'user'
  date?: string
  subtitle?: string
  avatarUrl?: string | null
}

interface MainFeedProps {
  initialFeedItems?: FeedItem[]
  userId?: string
  orgId?: string
  userRole?: UserRole
  userName?: string
}

export function MainFeed({ initialFeedItems = [], userId, orgId, userRole = 'volunteer', userName = 'User' }: MainFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialFeedItems)
  const [activeFilter, setActiveFilter] = useState<FilterType>("All")
  const [activeSort, setActiveSort] = useState("Latest")
  const [postContent, setPostContent] = useState("")
  const [postFocused, setPostFocused] = useState(false)
  const [postCategory, setPostCategory] = useState<PostCategory>("general")
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [linkedItems, setLinkedItems] = useState<Array<{ id: string; title: string; type: 'event' | 'project' | 'organization' | 'user' }>>([])
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([])
  const [existingEvents, setExistingEvents] = useState<Array<{ id: string; title: string; date?: string }>>([])
  const [existingProjects, setExistingProjects] = useState<Array<{ id: string; title: string; date?: string }>>([])
  const [existingOrganizations, setExistingOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const tagSelectorRef = useRef<HTMLDivElement>(null)

  // Fetch available users for @mention autocomplete
  useEffect(() => {
    async function fetchUsers() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('people')  // Using the 'people' view which includes organization_name
        .select('id, full_name, avatar_url, job_title, organization_name')
        .order('full_name')

      if (error) {
        console.error('Error fetching users for mentions:', error)
        return
      }

      if (data) {
        // Map the 'people' view structure to UserProfile
        type PeopleViewRow = { id: string; full_name: string; avatar_url: string | null; job_title: string | null; organization_name: string | null }
        const users: UserProfile[] = (data as PeopleViewRow[]).map(p => ({
          user_id: p.id || '',
          full_name: p.full_name || '',
          avatar_url: p.avatar_url,
          job_title: p.job_title,
          organization_name: p.organization_name
        }))
        setAvailableUsers(users)
      }
    }

    fetchUsers()
  }, [])

  // Fetch events, projects, and organizations for tag selector
  useEffect(() => {
    async function fetchTaggableItems() {
      if (!orgId) return

      const supabase = createClient()

      // Fetch recent events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, start_time')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('start_time', { ascending: true })
        .limit(5)

      if (eventsError) {
        console.error('Error fetching events:', eventsError)
      } else if (eventsData && eventsData.length > 0) {
        setExistingEvents((eventsData as Array<{ id: string; title: string; start_time: string }>).map(e => ({
          id: e.id,
          title: e.title,
          date: new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })))
      }

      // Fetch recent projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, target_date')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
      } else if (projectsData && projectsData.length > 0) {
        setExistingProjects((projectsData as Array<{ id: string; title: string; target_date: string | null }>).map(p => ({
          id: p.id,
          title: p.title,
          date: p.target_date
            ? new Date(p.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : 'Ongoing'
        })))
      }

      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')
        .limit(10)

      if (orgsError) {
        console.error('Error fetching organizations:', orgsError)
      } else if (orgsData && orgsData.length > 0) {
        setExistingOrganizations(orgsData as Array<{ id: string; name: string }>)
      }
    }

    fetchTaggableItems()
  }, [orgId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagSelectorRef.current && !tagSelectorRef.current.contains(event.target as Node)) {
        setShowTagSelector(false)
      }
    }
    if (showTagSelector) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showTagSelector])
  
  // Modal states
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [showWeeklyUpdate, setShowWeeklyUpdate] = useState(false)
  const [showPollDialog, setShowPollDialog] = useState(false)
  const [isPostSubmitting, setIsPostSubmitting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [createdPostId, setCreatedPostId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    function handleWeeklyUpdateOpen(event: Event) {
      setShowWeeklyUpdate(true)
    }

    window.addEventListener("ai-summary:open", handleWeeklyUpdateOpen as EventListener)
    return () => {
      window.removeEventListener("ai-summary:open", handleWeeklyUpdateOpen as EventListener)
    }
  }, [])
  
  // Alert state
  const [activeAlert, setActiveAlert] = useState<{
    id: string
    priority: "high" | "medium"
    title: string
    message: string
    audience: string
    author: { name: string; role: string; avatar: string }
    timeAgo: string
  } | null>(null)

  const filteredItems = feedItems.filter(item => {
    if (activeFilter === "All") return true
    if (activeFilter === "Events") return item.type === "event"
    if (activeFilter === "Projects") return item.type === "project"
    if (activeFilter === "Posts") return item.type === "post"
    return true
  })

  const handlePostSubmit = async () => {
    if (!userId || !orgId) {
      setPostError("User ID or Organization ID is missing")
      return
    }

    setIsPostSubmitting(true)
    setPostError(null)

    try {
      // Find linked event/project IDs
      const linkedEvent = linkedItems.find(item => item.type === 'event')
      const linkedProject = linkedItems.find(item => item.type === 'project')

      // Get mentioned user IDs from linked items (users selected via UI)
      const uiMentionedUserIds = linkedItems
        .filter(item => item.type === 'user')
        .map(item => item.id)

      // Combine UI-selected mentions with any tracked mentions
      const allMentionedUserIds = Array.from(new Set([...uiMentionedUserIds, ...mentionedUserIds]))

      const result = await createPost({
        content: postContent,
        authorId: userId,
        orgId: orgId,
        category: postCategory,
        linkedEventId: linkedEvent?.id,
        linkedProjectId: linkedProject?.id,
        mentionedUserIds: allMentionedUserIds.length > 0 ? allMentionedUserIds : undefined,
      })

      if (result.success && result.data) {
        // Store the created post ID for poll creation
        const postData = result.data as { id: string }
        setCreatedPostId(postData.id)

        setPostContent("")
        setPostCategory("general")
        setLinkedItems([])
        setMentionedUserIds([])
        setPostFocused(false)
        // Refresh to show new post
        router.refresh()
      } else {
        setPostError(result.error || "Failed to create post")
      }
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsPostSubmitting(false)
    }
  }

  // Handle @mention detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart

    setPostContent(value)
    setCursorPosition(position)

    // Check if typing @mention
    const textBeforeCursor = value.slice(0, position)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Only show dropdown if @ is at start of word and no space after @
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionSearch(textAfterAt.toLowerCase())
        setShowMentionDropdown(true)
      } else {
        setShowMentionDropdown(false)
      }
    } else {
      setShowMentionDropdown(false)
    }
  }

  // Insert mention
  const insertMention = (item: { id: string; title: string; type: 'event' | 'project' | 'organization' | 'user' }) => {
    const textBeforeCursor = postContent.slice(0, cursorPosition)
    const textAfterCursor = postContent.slice(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    // For user mentions, use @[Full Name] format to support names with spaces
    const mentionText = item.type === 'user' && item.title.includes(' ')
      ? `@[${item.title}]`
      : `@${item.title}`

    const newText = textBeforeCursor.slice(0, lastAtIndex) + mentionText + ' ' + textAfterCursor
    setPostContent(newText)
    setShowMentionDropdown(false)

    // Add to linked items if not already there
    if (!linkedItems.find(i => i.id === item.id)) {
      setLinkedItems([...linkedItems, item])
    }

    // Track user IDs for mentions
    if (item.type === 'user' && !mentionedUserIds.includes(item.id)) {
      setMentionedUserIds([...mentionedUserIds, item.id])
    }

    // Focus back on textarea
    textareaRef.current?.focus()
  }

  // Handle tag button click
  const handleTagClick = (item: { id: string; title: string; type: 'event' | 'project' | 'organization' | 'user' }) => {
    // Just add to linked items, don't insert @ in text
    if (!linkedItems.find(i => i.id === item.id)) {
      setLinkedItems([...linkedItems, item])
    }

    // Track user IDs for mentions
    if (item.type === 'user' && !mentionedUserIds.includes(item.id)) {
      setMentionedUserIds([...mentionedUserIds, item.id])
    }

    setShowTagSelector(false)
    textareaRef.current?.focus()
  }

  // Remove linked item
  const removeLinkedItem = (id: string) => {
    const item = linkedItems.find(i => i.id === id)
    setLinkedItems(linkedItems.filter(i => i.id !== id))

    // Remove from mentioned user IDs if it's a user
    if (item?.type === 'user') {
      setMentionedUserIds(mentionedUserIds.filter(uid => uid !== id))
    }

    // Only remove @mention from text if it exists
    if (item) {
      // Try both formats: @Name and @[Name]
      let newText = postContent
      if (postContent.includes(`@[${item.title}]`)) {
        newText = postContent.replace(`@[${item.title}]`, '').trim()
      } else if (postContent.includes(`@${item.title}`)) {
        newText = postContent.replace(`@${item.title}`, '').trim()
      }
      if (newText !== postContent) {
        setPostContent(newText)
      }
    }
  }

  // Filter items for mention dropdown - includes users from database
  const mentionableItems: MentionableItem[] = [
    // Add users from database
    ...availableUsers.map(u => ({
      id: u.user_id,
      title: u.full_name,
      type: 'user' as const,
      subtitle: u.job_title || u.organization_name || undefined,
      avatarUrl: u.avatar_url
    })),
    // Add events, projects, organizations
    ...existingEvents.map(e => ({ id: e.id, title: e.title, type: 'event' as const, date: e.date })),
    ...existingProjects.map(p => ({ id: p.id, title: p.title, type: 'project' as const, date: p.date })),
    ...existingOrganizations.map(o => ({ id: o.id, title: o.name, type: 'organization' as const }))
  ].filter(item => item.title.toLowerCase().includes(mentionSearch))

  const handleEventClick = () => {
    setShowEventDialog(true)
  }

  const handleProjectClick = () => {
    setShowProjectDialog(true)
  }

  const handleSendAlert = (alertData: {
    priority: "high" | "medium"
    title: string
    message: string
    audience: string
  }) => {
    // Create alert with current user info
    const roleDisplay = userRole === 'admin' ? 'Admin' :
                        userRole === 'st_martins_staff' ? 'St Martins Staff' :
                        userRole === 'partner_staff' ? 'Partner Staff' : 'Staff'
    setActiveAlert({
      id: `alert-${Date.now()}`,
      ...alertData,
      author: {
        name: userName,
        role: roleDisplay,
        avatar: "/placeholder.svg"
      },
      timeAgo: "just now"
    })
  }

  const handleDismissAlert = (id: string) => {
    setActiveAlert(null)
  }

  // Check if user can send alerts (admin or st_martins_staff only)
  const canSendAlerts = userRole === 'admin' || userRole === 'st_martins_staff'

  return (
    <main className="space-y-6">
      {/* Alert Banner - Pinned at top */}
      {activeAlert && (
        <AlertBanner
          {...activeAlert}
          onDismiss={handleDismissAlert}
        />
      )}
      
      {/* Welcome + Post Composer Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          {/* Welcome Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Welcome to The Village!</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Discover collaboration opportunities, upcoming events, and initiatives from charities in your network.
                Together, we can make a greater impact.
              </p>
            </div>
            <Button
              onClick={() => setShowWeeklyUpdate(true)}
              className="shrink-0 gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 transition-all relative overflow-hidden group"
            >
              {/* Continuous animated shine effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine"
                style={{
                  animation: 'shine 8s ease-in-out infinite'
                }}
              />
              <Sparkles className="h-4 w-4 relative z-10 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline relative z-10">This Week at the Village</span>
              <span className="sm:hidden relative z-10">This Week</span>
            </Button>
          </div>

          {/* Post Creation Area */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex gap-4">
              <Avatar className="h-11 w-11 ring-2 ring-gray-100 shrink-0">
                <AvatarImage src="/placeholder.svg" alt="You" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                  You
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="relative">
                  {/* Highlighted text overlay (shows @mentions in blue) */}
                  <div
                    className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-base px-0 py-0 text-transparent"
                    style={{
                      fontFamily: 'inherit',
                      fontSize: '16px',
                      lineHeight: '1.5',
                      minHeight: '72px'
                    }}
                  >
                    {/* Split on both @[Name] and @Name patterns */}
                    {postContent.split(/(@\[[^\]]+\]|@\w+)/g).map((part, i) => (
                      <span
                        key={i}
                        className={part.startsWith('@') ? 'text-blue-600 font-medium' : ''}
                      >
                        {part}
                      </span>
                    ))}
                  </div>

                <textarea
                    ref={textareaRef}
                    placeholder="Share an update with your community... (Type @ to mention people, events, or projects)"
                  value={postContent}
                    onChange={handleContentChange}
                    onFocus={() => setPostFocused(true)}
                    onBlur={(e) => {
                      // Check if the new focus target is within the post card
                      // If not, collapse the expanded area
                      if (!e.currentTarget.parentElement?.parentElement?.parentElement?.contains(e.relatedTarget as Node)) {
                        setPostFocused(false)
                      }
                    }}
                    className="relative w-full resize-none border-0 focus:outline-none focus:ring-0 text-base text-gray-900 placeholder:text-gray-400 min-h-[72px] bg-transparent"
                    style={{
                      background: 'transparent',
                      color: 'transparent',
                      caretColor: '#111827'
                    }}
                  />
                  
                  {/* @Mention Autocomplete Dropdown */}
                  <AnimatePresence>
                    {showMentionDropdown && mentionableItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-[calc(100vw-2rem)] sm:w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200 mt-1 max-h-64 overflow-y-auto left-0 sm:left-auto"
                      >
                        <div className="p-2">
                          <div className="text-xs text-gray-500 px-3 py-2 font-medium">
                            Mention a person, event, project, or organization
                          </div>
                          {mentionableItems.slice(0, 8).map((item) => (
                            <button
                              key={item.id}
                              onClick={() => insertMention(item)}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md transition-colors text-left"
                            >
                              {item.type === 'user' ? (
                                item.avatarUrl ? (
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={item.avatarUrl} alt={item.title} />
                                    <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                                      {item.title.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <User className="h-3 w-3 text-orange-600" />
                                  </div>
                                )
                              ) : item.type === 'event' ? (
                                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              ) : item.type === 'project' ? (
                                <Target className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {item.title}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {item.type === 'user' ? (item.subtitle || 'Person') : item.type}
                                  {item.date && ` - ${item.date}`}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Linked Items Display */}
                <AnimatePresence>
                  {linkedItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {linkedItems.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium",
                              item.type === 'event'
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : item.type === 'project'
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : item.type === 'user'
                                ? "bg-orange-50 border-orange-200 text-orange-700"
                                : "bg-purple-50 border-purple-200 text-purple-700"
                            )}
                          >
                            {item.type === 'event' ? (
                              <Calendar className="h-3 w-3" />
                            ) : item.type === 'project' ? (
                              <Target className="h-3 w-3" />
                            ) : item.type === 'user' ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            <span className="max-w-[200px] truncate">
                              {item.title}
                            </span>
                            <button
                              onClick={() => removeLinkedItem(item.id)}
                              className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Category Selector - Shows when focused and no modal open */}
                <AnimatePresence>
                  {postFocused && !showEventDialog && !showProjectDialog && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 pb-3 border-b border-gray-200"
                    >
                      <CategorySelector
                        selected={postCategory}
                        onChange={setPostCategory}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons Row - Shows attachment options when focused */}
                <AnimatePresence>
                  {postFocused && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 pb-3 border-b border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-nowrap overflow-x-auto sm:overflow-visible">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-primary hover:bg-primary/5 h-9 px-3 gap-2"
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-sm hidden sm:inline">Photo</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-primary hover:bg-primary/5 h-9 px-3 gap-2"
                        >
                          <Paperclip className="h-4 w-4" />
                          <span className="text-sm hidden sm:inline">Attachment</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            // Create a post first, then open poll dialog
                            if (!userId || !orgId) {
                              setPostError("User ID or Organization ID is missing")
                              return
                            }

                            if (!postContent.trim()) {
                              setPostError("Please write something before adding a poll")
                              return
                            }

                            setIsPostSubmitting(true)
                            setPostError(null)

                            try {
                              const linkedEvent = linkedItems.find(item => item.type === 'event')
                              const linkedProject = linkedItems.find(item => item.type === 'project')
                              const uiMentionedUserIds = linkedItems
                                .filter(item => item.type === 'user')
                                .map(item => item.id)
                              const allMentionedUserIds = Array.from(new Set([...uiMentionedUserIds, ...mentionedUserIds]))

                              const result = await createPost({
                                content: postContent,
                                authorId: userId,
                                orgId: orgId,
                                category: postCategory,
                                linkedEventId: linkedEvent?.id,
                                linkedProjectId: linkedProject?.id,
                                mentionedUserIds: allMentionedUserIds.length > 0 ? allMentionedUserIds : undefined,
                              })

                              if (result.success && result.data) {
                                const postData = result.data as { id: string }
                                setCreatedPostId(postData.id)
                                setPostContent("")
                                setPostCategory("general")
                                setLinkedItems([])
                                setMentionedUserIds([])
                                setPostFocused(false)
                                // Open poll dialog
                                setShowPollDialog(true)
                              } else {
                                setPostError(result.error || "Failed to create post")
                              }
                            } catch (err) {
                              setPostError(err instanceof Error ? err.message : "An unexpected error occurred")
                            } finally {
                              setIsPostSubmitting(false)
                            }
                          }}
                          disabled={!postContent.trim() || isPostSubmitting}
                          className="text-gray-500 hover:text-primary hover:bg-primary/5 h-9 px-3 gap-2"
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-sm hidden sm:inline">Poll</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-primary hover:bg-primary/5 h-9 px-3 gap-2"
                        >
                          <Smile className="h-4 w-4" />
                          <span className="text-sm hidden sm:inline">Emoji</span>
                        </Button>
                        
                        {/* Tag Button (Option B) */}
                        <div className="relative ml-auto" ref={tagSelectorRef}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTagSelector(!showTagSelector)}
                            className={cn(
                              "text-gray-500 hover:text-primary hover:bg-primary/5 h-9 px-3 gap-2",
                              showTagSelector && "bg-primary/10 text-primary"
                            )}
                          >
                            <Tag className="h-4 w-4" />
                            <span className="text-sm hidden lg:inline">Tag Event/Project</span>
                    </Button>

                          {/* Tag Selector Dropdown */}
                          <AnimatePresence>
                            {showTagSelector && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-[320px] bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                              >
                                <div className="p-3">
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Recent Events
                                  </div>
                                  <div className="space-y-1 mb-4">
                                    {existingEvents.slice(0, 3).map((event) => (
                                      <button
                                        key={event.id}
                                        onClick={() => handleTagClick({ ...event, type: 'event' })}
                                        disabled={linkedItems.some(i => i.id === event.id)}
                                        className={cn(
                                          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors",
                                          linkedItems.some(i => i.id === event.id)
                                            ? "bg-blue-50 text-blue-600 cursor-not-allowed"
                                            : "hover:bg-blue-50 hover:text-blue-600"
                                        )}
                                      >
                                        <Calendar className="h-4 w-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">{event.title}</div>
                                          {event.date && (
                                            <div className="text-xs text-gray-500">{event.date}</div>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                  </div>

                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Recent Projects
                                  </div>
                                  <div className="space-y-1 mb-4">
                                    {existingProjects.slice(0, 3).map((project) => (
                                      <button
                                        key={project.id}
                                        onClick={() => handleTagClick({ ...project, title: project.title, type: 'project' })}
                                        disabled={linkedItems.some(i => i.id === project.id)}
                                        className={cn(
                                          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors",
                                          linkedItems.some(i => i.id === project.id)
                                            ? "bg-emerald-50 text-emerald-600 cursor-not-allowed"
                                            : "hover:bg-emerald-50 hover:text-emerald-600"
                                        )}
                                      >
                                        <Target className="h-4 w-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">{project.title}</div>
                                          {project.date && (
                                            <div className="text-xs text-gray-500">{project.date}</div>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                  </div>

                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Organizations
                                  </div>
                                  <div className="space-y-1">
                                    {existingOrganizations.slice(0, 4).map((org) => (
                                      <button
                                        key={org.id}
                                        onClick={() => handleTagClick({ ...org, title: org.name, type: 'organization' })}
                                        disabled={linkedItems.some(i => i.id === org.id)}
                                        className={cn(
                                          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors",
                                          linkedItems.some(i => i.id === org.id)
                                            ? "bg-purple-50 text-purple-600 cursor-not-allowed"
                                            : "hover:bg-purple-50 hover:text-purple-600"
                                        )}
                                      >
                                        <Sparkles className="h-4 w-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">{org.name}</div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                  </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 h-9 px-3"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Create</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <DropdownMenuItem
                        onClick={handleEventClick}
                        className="gap-2"
                      >
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>Create Event</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleProjectClick}
                        className="gap-2"
                      >
                        <Target className="h-4 w-4 text-emerald-600" />
                        <span>Create Project</span>
                      </DropdownMenuItem>
                      
                      {/* Staff/Admin-only options */}
                      {canSendAlerts && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setShowAlertDialog(true)}
                            className="gap-2"
                          >
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-600">Send Alert</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                    <Button
                      size="sm"
                      disabled={!postContent.trim() || isPostSubmitting}
                      onClick={handlePostSubmit}
                      className="gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 h-9 px-4"
                    >
                      {isPostSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span className="text-sm">{isPostSubmitting ? "Posting..." : "Post"}</span>
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          {filterOptions.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "transition-all",
                activeFilter === filter
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted",
              )}
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <span className="text-xs">{activeSort}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {sortOptions.map((sort) => (
              <DropdownMenuItem
                key={sort}
                onClick={() => setActiveSort(sort)}
                className={cn(
                  "text-sm cursor-pointer",
                  activeSort === sort && "bg-muted font-medium"
                )}
              >
                {sort}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Feed Items */}
      {filteredItems.map((item, index) => (
        <div key={item.id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {item.type === "post" && <PostCard post={item} />}
            {item.type === "event" && <EventCard event={item} />}
            {item.type === "project" && <ProjectCard project={item} />}
          </motion.div>
        </div>
      ))}

      {/* Modals */}
      <WeeklyUpdateDialog 
        open={showWeeklyUpdate} 
        onOpenChange={setShowWeeklyUpdate} 
      />

      <CreateEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        userId={userId}
        orgId={orgId}
      />

      <CreateProjectDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        userId={userId}
        orgId={orgId}
      />

      <SendAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        onSend={handleSendAlert}
      />

      <CreatePollDialog
        open={showPollDialog}
        onOpenChange={setShowPollDialog}
        postId={createdPostId || undefined}
        onPollCreated={() => {
          setCreatedPostId(null)
          router.refresh()
        }}
      />
    </main>
  )
}
