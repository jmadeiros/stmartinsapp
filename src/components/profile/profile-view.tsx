'use client'

import { ProfileWithOrganization } from '@/lib/actions/profile'
import { ProfileHeader } from './profile-header'
import { ProfileAbout } from './profile-about'
import { ProfileSkills } from './profile-skills'
import { ProfileContact } from './profile-contact'
import { Card } from '@/components/ui/card'

interface ProfileViewProps {
  profile: ProfileWithOrganization
  isOwnProfile: boolean
  currentUserId: string
}

export function ProfileView({ profile, isOwnProfile, currentUserId }: ProfileViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header Section */}
        <Card>
          <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - About & Skills */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileAbout profile={profile} />
            <ProfileSkills profile={profile} />
          </div>

          {/* Right Column - Contact Info */}
          <div className="space-y-6">
            <ProfileContact profile={profile} />
          </div>
        </div>
      </div>
    </div>
  )
}
