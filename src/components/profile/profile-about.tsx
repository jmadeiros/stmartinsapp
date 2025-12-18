'use client'

import { ProfileWithOrganization } from '@/lib/actions/profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

interface ProfileAboutProps {
  profile: ProfileWithOrganization
}

export function ProfileAbout({ profile }: ProfileAboutProps) {
  if (!profile.bio) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          About
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
      </CardContent>
    </Card>
  )
}
