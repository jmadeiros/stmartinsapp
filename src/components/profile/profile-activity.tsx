'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Heart, MessageCircle, Share2, MoreHorizontal, FileText, CalendarDays, Loader2, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getUserPosts } from '@/lib/actions/posts'
import { getUserEvents, getUserRSVPs } from '@/lib/actions/events'
import { ProfileCollaborations } from './profile-collaborations'

interface ProfileActivityProps {
  userId: string
  userName?: string
  userAvatar?: string
  orgId?: string
}

type PostItem = {
  id: string
  content: string
  timeAgo: string
  likes: number
  comments: number
  image?: string
}

type EventItem = {
  id: string
  title: string
  start_time: string
  location: string
  attendeeCount?: number
  organization?: { name: string } | null
}

export function ProfileActivity({ userId, userName = 'User', userAvatar, orgId }: ProfileActivityProps) {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [organizedEvents, setOrganizedEvents] = useState<EventItem[]>([])
  const [attendingEvents, setAttendingEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [postsResult, eventsResult, rsvpsResult] = await Promise.all([
          getUserPosts(userId),
          getUserEvents(userId),
          getUserRSVPs(userId)
        ])

        if (postsResult.data) {
          setPosts(postsResult.data.slice(0, 5).map(p => ({
            id: p.id,
            content: p.content,
            timeAgo: p.timeAgo,
            likes: p.likes,
            comments: p.comments,
            image: p.image
          })))
        }

        if (eventsResult.data) {
          setOrganizedEvents(eventsResult.data.slice(0, 5) as EventItem[])
        }

        if (rsvpsResult.data) {
          setAttendingEvents(rsvpsResult.data.slice(0, 5) as EventItem[])
        }
      } catch (error) {
        console.error('Error fetching activity data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading activity...</span>
        </div>
      </Card>
    )
  }

  const hasNoPosts = posts.length === 0
  const hasNoOrganized = organizedEvents.length === 0
  const hasNoAttending = attendingEvents.length === 0

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 p-1 h-11">
          <TabsTrigger value="posts" className="gap-2 data-[state=active]:bg-white">
            <FileText className="h-4 w-4" />
            Posts
            {posts.length > 0 && <span className="text-xs text-muted-foreground">({posts.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="organized" className="gap-2 data-[state=active]:bg-white">
            <CalendarDays className="h-4 w-4" />
            Organized
            {organizedEvents.length > 0 && <span className="text-xs text-muted-foreground">({organizedEvents.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="attending" className="gap-2 data-[state=active]:bg-white">
            <Calendar className="h-4 w-4" />
            Attending
            {attendingEvents.length > 0 && <span className="text-xs text-muted-foreground">({attendingEvents.length})</span>}
          </TabsTrigger>
          {orgId && (
            <TabsTrigger value="collaborations" className="gap-2 data-[state=active]:bg-white">
              <Users className="h-4 w-4" />
              Collaborations
            </TabsTrigger>
          )}
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4 space-y-4">
          {hasNoPosts ? (
            <Card className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No posts yet</p>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="p-4 flex flex-row items-start gap-3 space-y-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{userName}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <p className="text-sm leading-relaxed">{post.content}</p>
                  
                  {post.image && (
                    <div className="rounded-xl overflow-hidden mt-3">
                      <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[300px]" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 pt-2">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50">
                      <Heart className="h-4 w-4" />
                      <span className="text-xs">{post.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-50">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs">{post.comments}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground ml-auto">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Organized Events Tab */}
        <TabsContent value="organized" className="mt-4 space-y-4">
          {hasNoOrganized ? (
            <Card className="p-8 text-center text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No events organized yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizedEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden group hover:shadow-md transition-all duration-300">
                  <div className="p-4">
                    <h4 className="font-semibold text-sm truncate">{event.title}</h4>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatEventDate(event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    {event.attendeeCount !== undefined && event.attendeeCount > 0 && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                          {[1,2,3].map(i => (
                            <div key={i} className="h-5 w-5 rounded-full border border-white bg-slate-200" />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">+{event.attendeeCount} attending</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Attending Events Tab */}
        <TabsContent value="attending" className="mt-4 space-y-4">
          {hasNoAttending ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Not attending any events</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attendingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden group hover:shadow-md transition-all duration-300">
                  <div className="p-4">
                    <h4 className="font-semibold text-sm truncate">{event.title}</h4>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatEventDate(event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Collaborations Tab */}
        {orgId && (
          <TabsContent value="collaborations" className="mt-4">
            <ProfileCollaborations orgId={orgId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
