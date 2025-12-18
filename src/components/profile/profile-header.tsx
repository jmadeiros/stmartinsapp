'use client'

import { ProfileWithOrganization } from '@/lib/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardContent } from '@/components/ui/card'
import { Building2, Edit, Mail, MapPin } from 'lucide-react'
import { useState } from 'react'
import { ProfileEditDialog } from './profile-edit-dialog'

interface ProfileHeaderProps {
  profile: ProfileWithOrganization
  isOwnProfile: boolean
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'st_martins_staff':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
            <AvatarFallback className="text-3xl font-semibold">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{profile.full_name}</h1>
                {profile.job_title && (
                  <p className="text-xl text-muted-foreground">{profile.job_title}</p>
                )}
              </div>

              {isOwnProfile && (
                <Button onClick={() => setEditDialogOpen(true)} variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Organization & Role */}
            <div className="flex flex-wrap items-center gap-3">
              {profile.organization && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{profile.organization.name}</span>
                </div>
              )}
              <Badge variant={getRoleBadgeVariant(profile.role)}>{formatRole(profile.role)}</Badge>
            </div>

            {/* Bio Preview */}
            {profile.bio && (
              <p className="text-muted-foreground line-clamp-2 max-w-2xl">{profile.bio}</p>
            )}
          </div>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      {isOwnProfile && (
        <ProfileEditDialog
          profile={profile}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </>
  )
}
