'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, isPast, isToday } from 'date-fns'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { completeActionItem, updateActionItemStatus } from '@/lib/actions/meeting-notes'
import type { ActionItem, ActionItemStatus } from '@/lib/meeting-notes/types'

interface ActionItemCardProps {
  item: ActionItem
  showMeetingLink?: boolean
  onStatusChange?: () => void
}

export function ActionItemCard({
  item,
  showMeetingLink = false,
  onStatusChange
}: ActionItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<ActionItemStatus>(item.status as ActionItemStatus)

  const isCompleted = currentStatus === 'completed'
  const isOverdue = item.due_date && isPast(new Date(item.due_date)) && !isCompleted
  const isDueToday = item.due_date && isToday(new Date(item.due_date))

  const handleToggleComplete = async () => {
    setIsUpdating(true)
    try {
      const newStatus: ActionItemStatus = isCompleted ? 'open' : 'completed'
      const result = isCompleted
        ? await updateActionItemStatus(item.id, 'open')
        : await completeActionItem(item.id)

      if (result.success) {
        setCurrentStatus(newStatus)
        onStatusChange?.()
      }
    } catch (error) {
      console.error('[ActionItemCard] Error updating status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-xl transition-all',
        isCompleted
          ? 'bg-muted/30'
          : isOverdue
            ? 'bg-red-50/50'
            : 'hover:bg-muted/30'
      )}
    >
      {/* Checkbox */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-6 w-6 shrink-0 p-0',
          isCompleted ? 'text-emerald-600' : 'text-muted-foreground hover:text-primary'
        )}
        onClick={handleToggleComplete}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </Button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {item.title}
        </p>

        {item.description && (
          <p
            className={cn(
              'text-xs text-muted-foreground mt-1 line-clamp-2',
              isCompleted && 'line-through'
            )}
          >
            {item.description}
          </p>
        )}

        <div className="flex items-center flex-wrap gap-2 mt-2">
          {/* Due date */}
          {item.due_date && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                isOverdue
                  ? 'bg-red-100 text-red-700 border-red-300'
                  : isDueToday
                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                    : isCompleted
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-white text-gray-600'
              )}
            >
              {isOverdue && <AlertCircle className="h-3 w-3 mr-1" />}
              {isDueToday && <Clock className="h-3 w-3 mr-1" />}
              {format(new Date(item.due_date), 'MMM d, yyyy')}
            </Badge>
          )}

          {/* Status badge */}
          {currentStatus === 'in_progress' && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              In Progress
            </Badge>
          )}

          {/* Meeting note link */}
          {showMeetingLink && item.meeting_note && (
            <Link
              href={`/meeting-notes/${item.meeting_note.id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{item.meeting_note.title}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
