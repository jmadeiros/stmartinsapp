import { notFound } from "next/navigation"
import { getPostById } from "@/lib/actions/posts"
import { PostCard } from "@/components/social/post-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PostPageProps {
  params: {
    id: string
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostById(params.id)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container max-w-2xl mx-auto py-8 px-4">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
        </div>

        {/* Post content */}
        <div data-testid="post-detail">
          <PostCard post={post} />
        </div>
      </div>
    </div>
  )
}
