"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  MoreHorizontal,
  Edit,
  Share2,
  Flag,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Calendar,
  Link as LinkIcon,
  CalendarPlus,
} from "lucide-react"

interface PostMenuProps {
  contentType: "event" | "project" | "post"
  isAuthor?: boolean
  isClosed?: boolean
  onEdit?: () => void
  onShare?: () => void
  onReport?: () => void
  onDelete?: () => void
  onToggleStatus?: () => void
  onUpdateProgress?: () => void
  onAddEvent?: () => void
  onLinkEvent?: () => void
  onAttachToProject?: () => void
  onDetachFromProject?: () => void
  onLinkToEvent?: () => void
  onLinkToProject?: () => void
  hasParentProject?: boolean
}

export function PostMenu({
  contentType,
  isAuthor = false,
  isClosed = false,
  hasParentProject = false,
  onEdit,
  onShare,
  onReport,
  onDelete,
  onToggleStatus,
  onUpdateProgress,
  onAddEvent,
  onLinkEvent,
  onAttachToProject,
  onDetachFromProject,
  onLinkToEvent,
  onLinkToProject,
}: PostMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isAuthor && onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit post
          </DropdownMenuItem>
        )}

        {contentType === "project" && (
          <>
            {onUpdateProgress && (
              <DropdownMenuItem onClick={onUpdateProgress}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Update progress
              </DropdownMenuItem>
            )}
            {onAddEvent && (
              <DropdownMenuItem onClick={onAddEvent}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Add event
              </DropdownMenuItem>
            )}
            {onLinkEvent && (
              <DropdownMenuItem onClick={onLinkEvent}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Link existing event
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {contentType === "event" && (
          <>
            {onAttachToProject && (
              <DropdownMenuItem onClick={onAttachToProject}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Attach to project
              </DropdownMenuItem>
            )}
            {hasParentProject && onDetachFromProject && (
              <DropdownMenuItem onClick={onDetachFromProject}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Detach from project
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {contentType === "post" && (
          <>
            {onLinkToEvent && (
              <DropdownMenuItem onClick={onLinkToEvent}>
                <Calendar className="mr-2 h-4 w-4" />
                Link to event
              </DropdownMenuItem>
            )}
            {onLinkToProject && (
              <DropdownMenuItem onClick={onLinkToProject}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Link to project
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {(contentType === "event" || contentType === "project") && onToggleStatus && (
          <>
            <DropdownMenuItem onClick={onToggleStatus}>
              {isClosed ? (
                <>
                  <ToggleRight className="mr-2 h-4 w-4" />
                  Reopen to new support
                </>
              ) : (
                <>
                  <ToggleLeft className="mr-2 h-4 w-4" />
                  Close to new support
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {onShare && (
          <DropdownMenuItem onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share with network
          </DropdownMenuItem>
        )}

        {onReport && (
          <DropdownMenuItem onClick={onReport}>
            <Flag className="mr-2 h-4 w-4" />
            Report/flag
          </DropdownMenuItem>
        )}

        {isAuthor && onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

