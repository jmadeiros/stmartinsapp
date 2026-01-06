'use client'

import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { Calendar, Tag, CheckSquare, FileText, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { MeetingNote } from '@/lib/meeting-notes/types'

interface MeetingNotesListProps {
  notes: MeetingNote[]
}

export function MeetingNotesList({ notes }: MeetingNotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No meeting notes yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Meeting notes will appear here once they&apos;re imported from Granola.
        </p>
      </div>
    )
  }

  // Group notes by month
  const groupedNotes = notes.reduce((acc, note) => {
    const date = note.meeting_date ? new Date(note.meeting_date) : new Date(note.created_at)
    const monthKey = format(date, 'MMMM yyyy')
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey].push(note)
    return acc
  }, {} as Record<string, MeetingNote[]>)

  return (
    <div className="space-y-8">
      {Object.entries(groupedNotes).map(([month, monthNotes]) => (
        <div key={month}>
          {/* Month header */}
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
            {month}
          </h2>

          {/* Notes for this month */}
          <div className="space-y-1">
            {monthNotes.map((note) => {
              const noteDate = note.meeting_date ? new Date(note.meeting_date) : new Date(note.created_at)
              const isRecent = Date.now() - noteDate.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days

              return (
                <Link key={note.id} href={`/meeting-notes/${note.id}`}>
                  <div className="group relative flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all cursor-pointer">
                    {/* Date column */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-2xl font-semibold text-foreground leading-none">
                        {format(noteDate, 'd')}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase mt-0.5">
                        {format(noteDate, 'EEE')}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {note.title}
                        </h3>
                        {isRecent && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 flex-shrink-0">
                            New
                          </Badge>
                        )}
                      </div>

                      {/* Preview text */}
                      {note.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {note.content.replace(/[#*_~`>\-\[\]]/g, '').replace(/\n+/g, ' ').substring(0, 180)}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center flex-wrap gap-3 mt-2">
                        {/* Time ago */}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(noteDate, { addSuffix: true })}
                        </span>

                        {/* Action items */}
                        {note.action_item_count !== undefined && note.action_item_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckSquare className="h-3 w-3" />
                            {note.action_item_count} task{note.action_item_count !== 1 ? 's' : ''}
                          </span>
                        )}

                        {/* Tags */}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {note.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
