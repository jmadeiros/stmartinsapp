import { getWebsiteQueue } from "@/lib/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { WebsiteQueueActions } from "./queue-actions"
import { formatDistanceToNow } from "date-fns"
import { Globe, FileText, Calendar, FolderKanban } from "lucide-react"

export default async function WebsiteQueuePage() {
  const queueResult = await getWebsiteQueue()

  if ('error' in queueResult) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error: {queueResult.error}</div>
      </div>
    )
  }

  const items = queueResult.data || []

  const typeIcons = {
    post: FileText,
    event: Calendar,
    project: FolderKanban,
  }

  const typeColors = {
    post: "bg-blue-100 text-blue-800 border-blue-200",
    event: "bg-purple-100 text-purple-800 border-purple-200",
    project: "bg-green-100 text-green-800 border-green-200",
  }

  const typeLabels = {
    post: "Post",
    event: "Event",
    project: "Project",
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Website Publishing Queue</h2>
        <p className="text-gray-600 mt-1">
          Review and approve content for website publication
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Globe className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-900 mb-1">
              Website Publishing Preparation
            </h4>
            <p className="text-sm text-yellow-800">
              This queue shows recent opportunities, events, and projects that could be
              published to the public website. Full website publishing functionality will
              be implemented in Task 3.17.
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Items in Queue
          </h3>
          <p className="text-gray-600">
            There are no recent items available for website publication.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const Icon = typeIcons[item.type]
                return (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell>
                      <Badge className={typeColors[item.type]}>
                        <Icon className="h-3 w-3 mr-1" />
                        {typeLabels[item.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.title}
                        </div>
                        {item.content && (
                          <div className="text-xs text-gray-500 mt-1 max-w-md">
                            {item.content.length > 120
                              ? `${item.content.substring(0, 120)}...`
                              : item.content}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {item.author_name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {item.org_name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <WebsiteQueueActions item={item} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Posts</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {items.filter(i => i.type === 'post').length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Events</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {items.filter(i => i.type === 'event').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="h-5 w-5 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Projects</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {items.filter(i => i.type === 'project').length}
          </p>
        </div>
      </div>
    </div>
  )
}
