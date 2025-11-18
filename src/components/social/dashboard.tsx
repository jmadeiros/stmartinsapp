import { SocialHeader } from "./header"
import { SocialLeftSidebar } from "./left-sidebar"
import { SocialRightSidebar } from "./right-sidebar"
import { MainFeed } from "./main-feed"

interface SocialDashboardProps {
  userName?: string
}

export function SocialDashboard({ userName }: SocialDashboardProps) {
  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
          <SocialLeftSidebar userName={userName} />
          <MainFeed />
          <SocialRightSidebar />
        </div>
      </div>
    </div>
  )
}

