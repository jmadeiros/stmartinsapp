/**
 * Content Type System - Type Definitions
 * Three main content types: Event, Project, Post
 */

export type Author = {
  name: string        // person's name
  handle: string
  avatar: string
  role?: string       // "Program Manager"
  organization?: string  // "Hope Foundation"
}

export type Collaboration = {
  organization: string
  avatar: string
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
  fundraisingGoal?: string       // for projects
}

export type Progress = {
  current: number
  target: number
  unit: string  // "trees", "USD", "volunteers"
  lastUpdated?: string
}

export type EventPost = {
  id: string
  type: "event"
  author: Author
  collaborations?: Collaboration[]  // partner organizations
  title: string
  description: string
  date: string
  time: string
  location: string
  cause?: string
  parentProjectId?: string
  partnerOrgs?: string[]  // orgs collaborating on this event
  needs?: Needs
  status?: "Open" | "Closed"
  timeAgo: string
  // Engagement tracking
  interestedOrgs?: string[]  // org IDs that showed interest
  participantsReferred?: number
}

export type ProjectPost = {
  id: string
  type: "project"
  author: Author
  collaborations?: Collaboration[]  // partner organizations
  title: string
  description: string
  impactGoal: string  // REQUIRED - clear impact statement
  cause?: string
  targetDate?: string  // optional - no date = ongoing
  serviceArea?: string
  partnerOrgs?: string[]  // orgs collaborating on this project
  needs?: Needs
  progress?: Progress  // optional progress tracking
  eventsCount?: number  // number of linked events
  timeAgo: string
  // Engagement tracking
  interestedOrgs?: string[]  // org IDs that showed interest
  participantsReferred?: number
}

export type PostCategory = "intros" | "wins" | "opportunities" | "questions" | "learnings" | "general"

export type Post = {
  id: string
  type: "post"
  author: Author
  title?: string  // optional
  content: string  // main text (required)
  category?: PostCategory  // optional category
  linkedEventId?: string
  linkedProjectId?: string
  cause?: string
  image?: string
  timeAgo: string
  likes?: number
  comments?: number
}

export type FeedItem = EventPost | ProjectPost | Post

export type ContentType = "event" | "project" | "post"

export type FilterType = "All" | "Events" | "Projects" | "Posts"


