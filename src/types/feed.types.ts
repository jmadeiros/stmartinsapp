/**
 * Content Type System - Type Definitions for Homepage Social Feed
 * Three main content types: Post, Event, Project
 */

export type Author = {
  name: string        // person's name
  handle: string      // @username
  avatar: string      // URL to avatar image
  role?: string       // "Program Manager"
  organization?: string  // "Hope Foundation"
}

export type Collaboration = {
  organization: string
  avatar: string      // org logo URL
}

export type ParticipantRequest = {
  programTag: string    // e.g., "After-School Program"
  count?: number        // optional count
}

export type Needs = {
  volunteersNeeded?: number
  participantRequests?: ParticipantRequest[]
  seekingPartners?: boolean
  resourcesRequested?: string[]  // for projects
  fundraisingGoal?: string       // for projects (e.g., "£5,000")
}

export type Progress = {
  current: number
  target: number
  unit: string  // "trees", "USD", "volunteers", "families served"
  lastUpdated?: string
}

/**
 * Post - General updates with optional categorization
 * Used for: announcements, questions, wins, intros, learnings, general discussion
 */
export type Post = {
  id: string
  type: "post"
  author: Author
  title?: string  // optional (posts can be content-only)
  content: string  // main text (required)
  category?: PostCategory  // optional category
  linkedEventId?: string   // reference to related event
  linkedProjectId?: string // reference to related project
  cause?: string           // optional cause tag
  image?: string           // optional image URL
  timeAgo: string          // "3 hours ago"
  likes?: number
  comments?: number
}

/**
 * Event - Time/location-specific activities
 * Used for: workshops, meetings, community events, fundraisers
 */
export type EventPost = {
  id: string
  type: "event"
  author: Author
  collaborations?: Collaboration[]  // partner organizations
  title: string
  description: string
  date: string           // "Dec 15, 2024"
  time: string           // "9:00 AM - 3:00 PM" or "All day"
  location: string       // "Community Center" or building room
  cause?: string         // "Food Security", "Youth Education", etc.
  parentProjectId?: string  // if event is part of a larger project
  partnerOrgs?: string[]    // org IDs collaborating on this event
  needs?: Needs
  status?: "Open" | "Closed"  // Closed stops new signups
  timeAgo: string
  // Engagement tracking
  interestedOrgs?: string[]  // org IDs that showed interest
  participantsReferred?: number
}

/**
 * Project - Long-term collaborative initiatives
 * Used for: ongoing programs, multi-charity collaborations, impact initiatives
 */
export type ProjectPost = {
  id: string
  type: "project"
  author: Author
  collaborations?: Collaboration[]  // partner organizations
  title: string
  description: string
  impactGoal: string  // REQUIRED - clear impact statement (e.g., "Plant 1,000 trees in East London")
  cause?: string
  targetDate?: string  // optional - no date = ongoing
  serviceArea?: string // "East London", "Building-wide", etc.
  partnerOrgs?: string[]  // org IDs collaborating on this project
  needs?: Needs
  progress?: Progress  // optional progress tracking
  eventsCount?: number  // number of linked events
  timeAgo: string
  // Engagement tracking
  interestedOrgs?: string[]  // org IDs that showed interest
  participantsReferred?: number
}

/**
 * Post categories - 6 types for organizing general updates
 */
export type PostCategory =
  | "intros"        // 👋 Team member introductions, welcome messages
  | "wins"          // 🎉 Celebrating successes and milestones
  | "opportunities" // 💼 Collaboration opportunities, quick asks
  | "questions"     // ❓ Community questions and discussions
  | "learnings"     // 📚 Insights, tips, lessons learned
  | "general"       // 💬 Everything else

/**
 * Union type for all feed content
 */
export type FeedItem = EventPost | ProjectPost | Post

/**
 * Content type discriminator
 */
export type ContentType = "event" | "project" | "post"

/**
 * Filter types for feed filtering
 */
export type FilterType = "All" | "Events" | "Projects" | "Posts"

/**
 * Sort options for feed
 */
export type SortOption = "Latest" | "Shared by" | "Shared with"

/**
 * Interest/Support commitment types
 */
export type CommitmentType =
  | "volunteer"     // I'll volunteer
  | "participants"  // Bring participants
  | "resources"     // Provide resources
  | "funding"       // Contribute funding
  | "partnership"   // My org wants to partner

/**
 * Support commitment structure
 */
export type SupportCommitment = {
  type: CommitmentType
  quantity?: number      // For volunteer/participant count
  details?: string       // For resource names, funding amount, etc.
}

/**
 * Type guards for discriminating feed items
 */
export function isPost(item: FeedItem): item is Post {
  return item.type === "post"
}

export function isEvent(item: FeedItem): item is EventPost {
  return item.type === "event"
}

export function isProject(item: FeedItem): item is ProjectPost {
  return item.type === "project"
}

/**
 * Helper function to get content type label
 */
export function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    event: "Event",
    project: "Project",
    post: "Post"
  }
  return labels[type]
}

/**
 * Helper function to get category label
 */
export function getCategoryLabel(category: PostCategory): string {
  const labels: Record<PostCategory, string> = {
    intros: "Introduction",
    wins: "Win",
    opportunities: "Opportunity",
    questions: "Question",
    learnings: "Learning",
    general: "General"
  }
  return labels[category]
}

/**
 * Helper function to get category emoji
 */
export function getCategoryEmoji(category: PostCategory): string {
  const emojis: Record<PostCategory, string> = {
    intros: "👋",
    wins: "🎉",
    opportunities: "💼",
    questions: "❓",
    learnings: "📚",
    general: "💬"
  }
  return emojis[category]
}
