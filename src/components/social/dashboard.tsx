import { SocialHeader } from "./header"
import { SocialLeftSidebar } from "./left-sidebar"
import { SocialRightSidebar } from "./right-sidebar"
import { MainFeed } from "./main-feed"
import type { FeedItem } from "@/lib/types"

type UserRole = 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'

interface SocialDashboardProps {
  userName?: string
  feedItems?: FeedItem[]
  userId?: string
  orgId?: string
  userRole?: UserRole
}

export function SocialDashboard({ userName, feedItems, userId, orgId, userRole = 'volunteer' }: SocialDashboardProps) {
  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
          <SocialLeftSidebar userName={userName} userId={userId} orgId={orgId} />
          <MainFeed initialFeedItems={feedItems} userId={userId} orgId={orgId} userRole={userRole} userName={userName} />
          <SocialRightSidebar userId={userId} orgId={orgId} userRole={userRole} />
        </div>
      </div>
    </div>
  )
}

