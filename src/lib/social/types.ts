export type Author = {
  name: string
  handle: string
  avatar: string
  role?: string
  organization?: string
}

export type Collaboration = {
  organization: string
  avatar: string
}

export type ParticipantRequest = {
  programTag: string
  count?: number
}

export type Needs = {
  volunteersNeeded?: number
  participantRequests?: ParticipantRequest[]
  seekingPartners?: boolean
  resourcesRequested?: string[]
  fundraisingGoal?: string
}

export type Progress = {
  current: number
  target: number
  unit: string
  lastUpdated?: string
}

export type EventPost = {
  id: string
  type: "event"
  author: Author
  collaborations?: Collaboration[]
  title: string
  description: string
  date: string
  time: string
  location: string
  cause?: string
  parentProjectId?: string
  partnerOrgs?: string[]
  needs?: Needs
  status?: "Open" | "Closed"
  timeAgo: string
  interestedOrgs?: string[]
  participantsReferred?: number
}

export type ProjectPost = {
  id: string
  type: "project"
  author: Author
  collaborations?: Collaboration[]
  title: string
  description: string
  impactGoal: string
  cause?: string
  targetDate?: string
  serviceArea?: string
  partnerOrgs?: string[]
  needs?: Needs
  progress?: Progress
  eventsCount?: number
  timeAgo: string
  interestedOrgs?: string[]
  participantsReferred?: number
}

export type PostCategory = "intros" | "wins" | "opportunities" | "questions" | "learnings" | "general"

export type FeedPost = {
  id: string
  type: "post"
  author: Author
  title?: string
  content: string
  category?: PostCategory
  linkedEventId?: string
  linkedProjectId?: string
  cause?: string
  image?: string
  timeAgo: string
  likes?: number
  comments?: number
  isPinned?: boolean
  pinnedAt?: string
  pinnedBy?: string
}

export type FeedItem = EventPost | ProjectPost | FeedPost

export type FilterType = "All" | "Events" | "Projects" | "Posts"

// Alias for backwards compatibility
export type Post = FeedPost

