'use client'

import { ProfileWithOrganization } from '@/lib/actions/profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Award } from 'lucide-react'

interface ProfileSkillsProps {
  profile: ProfileWithOrganization
}

export function ProfileSkills({ profile }: ProfileSkillsProps) {
  const hasSkills = profile.skills && profile.skills.length > 0
  const hasInterests = profile.interests && profile.interests.length > 0

  if (!hasSkills && !hasInterests) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Skills */}
      {hasSkills && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills!.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interests */}
      {hasInterests && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.interests!.map((interest) => (
                <Badge key={interest} variant="outline" className="text-sm">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
