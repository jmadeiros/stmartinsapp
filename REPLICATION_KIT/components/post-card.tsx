"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Heart, ExternalLink, Calendar, Target } from "lucide-react"
import { ContentBadge } from "@/components/ui/content-badge"
import { CategoryBadge } from "@/components/ui/category-badge"
import { PostMenu } from "@/components/ui/post-menu"
import type { Post } from "@/lib/types"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  // Determine CTA based on linked content
  const getCTA = () => {
    if (post.linkedEventId) {
      return {
        text: "View Event",
        icon: Calendar,
        onClick: () => {
          console.log("Navigate to event:", post.linkedEventId)
          // TODO: Implement navigation to event
        }
      }
    }
    if (post.linkedProjectId) {
      return {
        text: "View Project",
        icon: Target,
        onClick: () => {
          console.log("Navigate to project:", post.linkedProjectId)
          // TODO: Implement navigation to project
        }
      }
    }
    return null
  }

  const cta = getCTA()

  return (
    <Card className="overflow-hidden border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                {post.author.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">
                {post.author.role && post.author.organization 
                  ? `${post.author.role} at ${post.author.organization}`
                  : post.author.organization || post.author.handle
                } · {post.timeAgo}
              </p>
            </div>
          </div>
          <PostMenu
            contentType="post"
            isAuthor={false}
            onEdit={() => console.log("Edit post")}
            onShare={() => console.log("Share post")}
            onReport={() => console.log("Report post")}
            onLinkToEvent={() => console.log("Link to event")}
            onLinkToProject={() => console.log("Link to project")}
          />
        </div>

        {/* Badges - Category and Cause */}
        {(post.category || post.cause) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.category && <CategoryBadge category={post.category} />}
            {/* Only show cause for learnings - other categories won't have that option */}
            {post.cause && post.category === 'learnings' && (
              <ContentBadge type="cause" label={post.cause} />
            )}
          </div>
        )}

        {/* Title (optional) */}
        {post.title && (
          <h2 className="mb-2 text-lg font-bold text-foreground tracking-tight">{post.title}</h2>
        )}

        {/* Content */}
        <p className="mb-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>

        {/* Linked Content Indicator */}
        {(post.linkedEventId || post.linkedProjectId) && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {post.linkedEventId ? "About:" : "About:"}
              </span>
              <span className="font-medium text-foreground">
                {/* TODO: Show actual linked item name */}
                {post.linkedEventId ? "Linked Event" : "Linked Project"}
              </span>
            </div>
          </div>
        )}

        {/* Image (if attached) */}
        {post.image && (
          <div className="mb-4 overflow-hidden rounded-xl">
            <img src={post.image} alt={post.title || "Post image"} className="h-[200px] w-full object-cover" />
          </div>
        )}

        {/* Footer - Engagement & CTA */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Heart className="h-4 w-4" />
              <span className="text-xs">{post.likes || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{post.comments || 0}</span>
            </Button>
          </div>

          {/* Conditional CTA */}
          {cta && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={cta.onClick}
              className="gap-2"
            >
              <cta.icon className="h-3.5 w-3.5" />
              {cta.text}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}


