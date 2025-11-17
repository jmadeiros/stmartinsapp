"use client"

import { cn } from "@/lib/utils"
import { PostCard } from "@/components/post-card"
import { EventCard } from "@/components/event-card"
import { ProjectCard } from "@/components/project-card"
import { CreateEventDialog } from "@/components/create-event-dialog"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { SendAlertDialog } from "@/components/send-alert-dialog"
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
import { Sparkles, Send, Image as ImageIcon, Smile, Calendar, Target, BarChart3, Paperclip, Tag, X, Plus, AlertTriangle } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { FeedItem, FilterType, PostCategory } from "@/lib/types"
import { CategorySelector } from "@/components/ui/category-selector"

// Sample data
const feedItems: FeedItem[] = [
  {
    id: "event-1",
    type: "event",
    author: {
      name: "Marcus Rodriguez",
      handle: "@marcus.rodriguez",
      avatar: "/professional-woman.png",
      role: "Community Outreach Coordinator",
      organization: "Hope Foundation",
    },
    collaborations: [
      { organization: "City Food Bank", avatar: "/placeholder.svg" },
      { organization: "Westside Community Kitchen", avatar: "/placeholder.svg" },
      { organization: "Neighborhood Pantry", avatar: "/placeholder.svg" },
    ],
    title: "Community Food Drive & Distribution",
    description: "We're organizing a major food drive to support families in need this holiday season.",
    date: "Dec 15, 2024",
    time: "9:00 AM - 3:00 PM",
    location: "Community Center, Downtown",
    cause: "Food Security",
    needs: {
    volunteersNeeded: 25,
      seekingPartners: true
    },
    partnerOrgs: ["City Food Bank", "Community Kitchen", "Neighborhood Alliance"],
    interestedOrgs: ["Org1", "Org2", "Org3"],
    timeAgo: "3 hours ago",
  },
  {
    id: "project-1",
    type: "project",
    author: {
      name: "Sarah Chen",
      handle: "@sarah.chen",
      avatar: "/professional-woman.png",
      role: "Environmental Programs Director",
      organization: "Green Earth Alliance",
    },
    collaborations: [
      { organization: "Urban Roots Collective", avatar: "/placeholder.svg" },
      { organization: "City Parks Coalition", avatar: "/placeholder.svg" },
    ],
    title: "Urban Tree Planting Initiative",
    description: "Collaborative effort to increase urban tree coverage and combat climate change.",
    impactGoal: "Plant 5,000 trees across 10 neighborhoods by spring to create healthier communities",
    cause: "Environment",
    targetDate: "March 20, 2025",
    progress: {
      current: 3350,
      target: 5000,
      unit: "trees",
      lastUpdated: "2 days ago"
    },
    needs: {
      volunteersNeeded: 100,
    fundraisingGoal: "$50K",
      seekingPartners: true
    },
    partnerOrgs: ["City Parks Coalition", "Community Gardeners"],
    interestedOrgs: ["Org1", "Org2", "Org3", "Org4", "Org5"],
    eventsCount: 3,
    timeAgo: "6 hours ago",
  },
  {
    id: "post-1",
    type: "post",
    author: {
      name: "David Park",
      handle: "@david.park",
      avatar: "/professional-woman.png",
      role: "Program Manager",
      organization: "Community Outreach Network",
    },
    category: "wins",
    content: "Incredible turnout at today's food drive! We served over 300 families and collected 2 tons of food donations. Thank you to everyone who volunteered and contributed!",
    timeAgo: "2 hours ago",
    likes: 24,
    comments: 8,
  },
  {
    id: "post-2",
    type: "post",
    author: {
      name: "Emily Johnson",
      handle: "@emily.j",
      avatar: "/professional-woman.png",
      organization: "Youth Development Alliance",
    },
    category: "intros",
    title: "Hello from Youth Development Alliance!",
    content: "Hi everyone! I'm Emily, joining this community to connect with other organizations working on youth programs. We focus on after-school mentorship and skills training. Looking forward to collaborating!",
    timeAgo: "5 hours ago",
    likes: 15,
    comments: 6,
  },
  {
    id: "post-3",
    type: "post",
    author: {
      name: "Michael Torres",
      handle: "@m.torres",
      avatar: "/professional-woman.png",
      role: "Volunteer Coordinator",
      organization: "Hope Foundation",
    },
    category: "opportunities",
    content: "We're looking for volunteers with event planning experience to help organize our annual fundraiser in March. Also seeking a partner org that can provide venue space. Please reach out if interested!",
    timeAgo: "1 day ago",
    likes: 12,
    comments: 5,
  },
  {
    id: "post-4",
    type: "post",
    author: {
      name: "Lisa Anderson",
      handle: "@l.anderson",
      avatar: "/professional-woman.png",
      role: "Research Lead",
      organization: "Green Earth Alliance",
    },
    category: "questions",
    content: "Has anyone here successfully applied for EPA environmental grants? Would love to hear about your experience and any tips for the application process.",
    timeAgo: "8 hours ago",
    likes: 8,
    comments: 12,
  },
  {
    id: "post-5",
    type: "post",
    author: {
      name: "James Wilson",
      handle: "@j.wilson",
      avatar: "/professional-woman.png",
      role: "Operations Director",
      organization: "City Food Bank",
    },
    category: "learnings",
    content: "After 3 years of running our mobile food pantry, here's what we learned: 1) Consistency matters more than quantity, 2) Partner with local schools for better reach, 3) Digital sign-ups reduce wait times by 40%. Happy to share more details!",
    cause: "Food Security",
    timeAgo: "1 day ago",
    likes: 31,
    comments: 14,
  },
]

// Mock existing items for selection modal
const existingEvents = [
  { id: "event-1", title: "Community Food Drive & Distribution", date: "Dec 15" },
  { id: "event-2", title: "After-School Program Launch", date: "Dec 18" },
  { id: "event-3", title: "Health Screening Day", date: "Jan 10" },
]

const existingProjects = [
  { id: "project-1", title: "Urban Tree Planting Initiative", date: "March 2025" },
  { id: "project-2", title: "Mobile Health Clinic Outreach", date: "Feb 2025" },
  { id: "project-3", title: "Youth Mentorship Program", date: "Ongoing" },
]

const existingOrganizations = [
  { id: "org-1", name: "Hope Foundation" },
  { id: "org-2", name: "Green Earth Alliance" },
  { id: "org-3", name: "Community Outreach Network" },
  { id: "org-4", name: "City Food Bank" },
  { id: "org-5", name: "Youth Development Alliance" },
  { id: "org-6", name: "Neighborhood Alliance" },
]

const filterOptions: FilterType[] = ["All", "Events", "Projects", "Posts"]
const sortOptions = ["Latest", "Shared by", "Shared with"]

export function MainFeed() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All")
  const [activeSort, setActiveSort] = useState("Latest")
  const [postContent, setPostContent] = useState("")
  const [postFocused, setPostFocused] = useState(false)
  const [postCategory, setPostCategory] = useState<PostCategory>("general")
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [linkedItems, setLinkedItems] = useState<Array<{ id: string; title: string; type: 'event' | 'project' | 'organization' }>>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const tagSelectorRef = useRef<HTMLDivElement>(null)

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
  const [showAISummary, setShowAISummary] = useState(false)

  useEffect(() => {
    function handleAISummaryOpen(event: Event) {
      setShowAISummary(true)
      requestAnimationFrame(() => {
        const card = document.getElementById("ai-summary-card")
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      })
    }

    window.addEventListener("ai-summary:open", handleAISummaryOpen as EventListener)
    return () => {
      window.removeEventListener("ai-summary:open", handleAISummaryOpen as EventListener)
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

  const handlePostSubmit = () => {
    console.log("Creating post:", { 
      content: postContent,
      category: postCategory,
      linkedItems: linkedItems
    })
    setPostContent("")
    setPostCategory("general")
    setLinkedItems([])
    setPostFocused(false)
  }

  // Handle @mention detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart
    
    setPostContent(value)
    setCursorPosition(position)

    const trimmed = value.trim().toLowerCase()
    if (trimmed === "/event") {
      setPostContent("")
      setShowEventDialog(true)
      setPostFocused(false)
      return
    }
    if (trimmed === "/project") {
      setPostContent("")
      setShowProjectDialog(true)
      setPostFocused(false)
      return
    }
    
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
  const insertMention = (item: { id: string; title: string; type: 'event' | 'project' | 'organization' }) => {
    const textBeforeCursor = postContent.slice(0, cursorPosition)
    const textAfterCursor = postContent.slice(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    const newText = textBeforeCursor.slice(0, lastAtIndex) + `@${item.title}` + textAfterCursor
    setPostContent(newText)
    setShowMentionDropdown(false)
    
    // Add to linked items if not already there
    if (!linkedItems.find(i => i.id === item.id)) {
      setLinkedItems([...linkedItems, item])
    }
    
    // Focus back on textarea
    textareaRef.current?.focus()
  }

  // Handle tag button click
  const handleTagClick = (item: { id: string; title: string; type: 'event' | 'project' | 'organization' }) => {
    // Just add to linked items, don't insert @ in text
    if (!linkedItems.find(i => i.id === item.id)) {
      setLinkedItems([...linkedItems, item])
    }
    
    setShowTagSelector(false)
    textareaRef.current?.focus()
  }

  // Remove linked item
  const removeLinkedItem = (id: string) => {
    const item = linkedItems.find(i => i.id === id)
    setLinkedItems(linkedItems.filter(i => i.id !== id))
    
    // Only remove @mention from text if it exists
    if (item && postContent.includes(`@${item.title}`)) {
      const newText = postContent.replace(`@${item.title}`, '').trim()
      setPostContent(newText)
    }
  }

  // Filter items for mention dropdown
  const mentionableItems = [
    ...existingEvents.map(e => ({ ...e, title: e.title, type: 'event' as const })),
    ...existingProjects.map(p => ({ ...p, title: p.title, type: 'project' as const })),
    ...existingOrganizations.map(o => ({ ...o, title: o.name, type: 'organization' as const }))
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
    setActiveAlert({
      id: `alert-${Date.now()}`,
      ...alertData,
      author: {
        name: "Current User", // TODO: Replace with actual user data
        role: "Manager", // TODO: Replace with actual user role
        avatar: "/professional-woman.png"
      },
      timeAgo: "just now"
    })
    
    console.log("Alert sent:", alertData)
  }

  const handleDismissAlert = (id: string) => {
    setActiveAlert(null)
  }

  // TODO: Replace with actual role check from auth
  const isManager = true // For now, always show for demo

  return (
    <main className="space-y-6">
      {/* Alert Banner - Pinned at top */}
      {activeAlert && (
        <AlertBanner
          {...activeAlert}
          onDismiss={handleDismissAlert}
        />
      )}
      
      {/* Create Post Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          {/* Welcome Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Welcome to the Community!</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Discover collaboration opportunities, upcoming events, and initiatives from charities in your network. 
                Together, we can make a greater impact.
              </p>
            </div>
            <Button
              onClick={() => setShowAISummary(!showAISummary)}
              className="shrink-0 gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 transition-all relative overflow-hidden group"
            >
              {/* Continuous animated shine effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine"
                style={{
                  animation: 'shine 8s ease-in-out infinite'
                }}
              />
              <style jsx>{`
                @keyframes shine {
                  0% { transform: translateX(-100%); }
                  20% { transform: translateX(100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>
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
                    {postContent.split(/(@[\w\s-]+)/g).map((part, i) => (
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
                    placeholder="Share an update with your community... (Try typing @)"
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
                        className="absolute z-50 w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200 mt-1 max-h-64 overflow-y-auto"
                      >
                        <div className="p-2">
                          <div className="text-xs text-gray-500 px-3 py-2 font-medium">
                            Tag Event, Project, or Organization
                          </div>
                          {mentionableItems.slice(0, 8).map((item) => (
                            <button
                              key={item.id}
                              onClick={() => insertMention(item)}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md transition-colors text-left"
                            >
                              {item.type === 'event' ? (
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
                                  {item.type}
                                  {'date' in item && item.date && ` • ${item.date}`}
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
                                : "bg-purple-50 border-purple-200 text-purple-700"
                            )}
                          >
                            {item.type === 'event' ? (
                              <Calendar className="h-3 w-3" />
                            ) : item.type === 'project' ? (
                              <Target className="h-3 w-3" />
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
                                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
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
                      
                      {/* Manager-only options */}
                      {isManager && (
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
                      disabled={!postContent.trim()}
                    onClick={handlePostSubmit}
                      className="gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 h-9 px-4"
                    >
                      <Send className="h-4 w-4" />
                      <span className="text-sm">Post</span>
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

        <div className="flex items-center gap-2">
          {sortOptions.map((sort) => (
            <Button
              key={sort}
              variant={activeSort === sort ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSort(sort)}
              className={cn(
                "transition-all text-xs",
                activeSort === sort
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted",
              )}
            >
              {sort}
            </Button>
          ))}
        </div>
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
          
          {/* AI Summary Card - appears after 2nd item in feed */}
          {index === 1 && (
            <motion.div
              id="ai-summary-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-6"
            >
              <Card className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 rounded-xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 p-3">
                  {/* Icon/Image Section */}
                  <div className="shrink-0">
                    <div className="h-11 w-11 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white leading-tight">Monday's Team Meeting Notes</h3>
                    <p className="text-xs text-white/90 leading-tight mt-0.5">Friday, July 10 at 4:00 PM</p>
                  </div>
                  
                  {/* Action Button */}
                  <Button
                    onClick={() => setShowAISummary(!showAISummary)}
                    className="shrink-0 bg-white hover:bg-white/90 text-orange-600 font-semibold px-4 py-1.5 text-sm rounded-lg shadow-md transition-all"
                  >
                    Attend
                  </Button>
                </div>
                
                {/* Expanded AI Summary */}
                <AnimatePresence>
                  {showAISummary && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white p-6 border-t border-purple-200/30">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Your Weekly AI Summary</h3>
                            <p className="text-sm text-gray-600">AI-powered insights from this week's activity</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAISummary(false)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Last Week */}
                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                            <div className="flex items-center gap-2 mb-3">
                              <BarChart3 className="h-4 w-4 text-purple-600" />
                              <h4 className="font-semibold text-gray-900">Last Week's Highlights</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700">
                              <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span><strong>15 new collaborations</strong> started across 8 charities</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span>Community Food Drive saw <strong>200+ RSVPs</strong></span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span>Most active: <strong>Hope Foundation</strong> with 24 posts</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span>Urban Tree Initiative reached <strong>67% of target</strong></span>
                              </li>
                            </ul>
                          </div>
                          
                          {/* This Week */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold text-gray-900">This Week's Focus</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700">
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span><strong>3 major events</strong> happening this week</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Volunteer Training needs <strong>12 more sign-ups</strong></span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span><strong>5 charities</strong> looking for partners</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Trending topic: <strong>#MentalHealthSupport</strong></span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )}
        </div>
      ))}

      {/* Modals */}
      <CreateEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
      />

      <CreateProjectDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
      />

      <SendAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        onSend={handleSendAlert}
      />
    </main>
  )
}
