import { Suspense } from 'react'
import { searchAll } from '@/lib/actions/search'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, Calendar, FolderKanban, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>
}

async function SearchResults({ query }: { query: string }) {
  const result = await searchAll(query)

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Search Error</h3>
        <p className="text-muted-foreground">{result.error || 'Something went wrong'}</p>
      </div>
    )
  }

  const { posts, events, projects, people } = result.data
  const totalResults = posts.length + events.length + projects.length + people.length

  if (totalResults === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No results found</h3>
        <p className="text-muted-foreground">
          Try searching with different keywords
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Posts Section */}
      {posts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Posts</h2>
            <Badge variant="secondary">{posts.length}</Badge>
          </div>
          <div className="space-y-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {post.title && (
                        <h3 className="font-semibold mb-1 line-clamp-1">{post.title}</h3>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">
                          {post.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Events Section */}
      {events.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Events</h2>
            <Badge variant="secondary">{events.length}</Badge>
          </div>
          <div className="space-y-3">
            {events.map((event) => (
              <Link key={event.id} href={`/calendar?event=${event.id}`}>
                <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-1">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <span>
                          {new Date(event.start_time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                        {event.location && (
                          <>
                            <span>•</span>
                            <span className="line-clamp-1">{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Projects Section */}
      {projects.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Projects</h2>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
          <div className="space-y-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <FolderKanban className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* People Section */}
      {people.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">People</h2>
            <Badge variant="secondary">{people.length}</Badge>
          </div>
          <div className="space-y-3">
            {people.map((person) => (
              <Link key={person.user_id} href={`/people/${person.user_id}`}>
                <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={person.avatar_url || undefined} />
                      <AvatarFallback>
                        {person.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-1">{person.full_name}</h3>
                      {person.job_title && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                          {person.job_title}
                        </p>
                      )}
                      {person.organization_name && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {person.organization_name}
                        </p>
                      )}
                      {person.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {person.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-muted rounded w-full animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        {query && (
          <p className="text-muted-foreground">
            Showing results for &quot;{query}&quot;
          </p>
        )}
      </div>

      {query ? (
        <Suspense fallback={<SearchSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Start searching</h3>
          <p className="text-muted-foreground">
            Enter a search term to find posts, events, projects, and people
          </p>
        </div>
      )}
    </div>
  )
}
