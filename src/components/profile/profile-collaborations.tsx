'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, FolderKanban, Building2, Loader2, Users } from 'lucide-react'
import { getMyCollaborations, type CollaborationItem } from '@/lib/actions/collaboration'
import { formatDistanceToNow } from 'date-fns'

interface ProfileCollaborationsProps {
  orgId: string
}

export function ProfileCollaborations({ orgId }: ProfileCollaborationsProps) {
  const [collaborations, setCollaborations] = useState<CollaborationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCollaborations() {
      setLoading(true)
      try {
        const result = await getMyCollaborations(orgId)
        if (result.success) {
          setCollaborations(result.data)
        } else {
          setError(result.error || 'Failed to load collaborations')
        }
      } catch (err) {
        setError('An unexpected error occurred')
        console.error('[ProfileCollaborations] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchCollaborations()
    }
  }, [orgId])

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading collaborations...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>{error}</p>
      </Card>
    )
  }

  if (collaborations.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No collaborations yet</p>
        <p className="text-sm mt-1">
          When your organization joins events or projects as a collaborator, they'll appear here.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {collaborations.map((item) => (
        <Link
          key={`${item.type}-${item.id}`}
          href={`/${item.type}s/${item.id}`}
          className="block"
        >
          <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 h-full">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {item.type === 'event' ? (
                    <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={item.type === 'event'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 text-xs'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                      }
                    >
                      {item.type === 'event' ? 'Event' : 'Project'}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={item.ownerOrgLogo || undefined} />
                      <AvatarFallback className="text-[8px]">
                        <Building2 className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">by {item.ownerOrgName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Added {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
