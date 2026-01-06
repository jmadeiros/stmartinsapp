'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ActionItemCard } from './action-item-card'
import type { MeetingNote } from '@/lib/meeting-notes/types'

interface MeetingNoteDetailProps {
  note: MeetingNote
  previousNote?: { id: string; title: string } | null
  nextNote?: { id: string; title: string } | null
}

export function MeetingNoteDetail({
  note,
  previousNote,
  nextNote
}: MeetingNoteDetailProps) {
  const [, setRefreshKey] = useState(0)

  const handleActionItemChange = () => {
    setRefreshKey(k => k + 1)
  }

  const completedCount = note.action_items?.filter(i => i.status === 'completed').length || 0
  const totalCount = note.action_items?.length || 0

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/meeting-notes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to notes
        </Link>

        <div className="flex items-center gap-1">
          {previousNote ? (
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
              <Link href={`/meeting-notes/${previousNote.id}`} title={previousNote.title}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {nextNote ? (
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
              <Link href={`/meeting-notes/${nextNote.id}`} title={nextNote.title}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Title & Meta */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight mb-4">
          {note.title}
        </h1>

        <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
          {note.meeting_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(note.meeting_date), 'EEEE, MMMM d, yyyy')}
            </span>
          )}

          {note.author && (
            <span className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={note.author.avatar_url || undefined} />
                <AvatarFallback className="text-[8px] bg-primary/10">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              {note.author.full_name}
            </span>
          )}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Divider */}
      <div className="h-px bg-border mb-8" />

      {/* Content - Notion-like prose */}
      <article className="prose prose-gray prose-lg max-w-none mb-12">
        <style jsx global>{`
          .prose h1 { font-size: 1.875rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }
          .prose h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.75rem; }
          .prose h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; }
          .prose p { margin-bottom: 1rem; line-height: 1.75; }
          .prose ul, .prose ol { margin-bottom: 1rem; padding-left: 1.5rem; }
          .prose li { margin-bottom: 0.375rem; line-height: 1.625; }
          .prose li::marker { color: var(--muted-foreground); }
          .prose blockquote {
            border-left: 3px solid hsl(var(--primary));
            padding-left: 1rem;
            margin: 1.5rem 0;
            color: hsl(var(--muted-foreground));
            font-style: normal;
          }
          .prose code {
            background: hsl(var(--muted));
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-size: 0.875em;
          }
          .prose pre {
            background: hsl(var(--muted));
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
          }
          .prose strong { font-weight: 600; }
          .prose a { color: hsl(var(--primary)); text-decoration: underline; }
        `}</style>
        {note.content ? (
          <ReactMarkdown>{note.content}</ReactMarkdown>
        ) : (
          <p className="text-muted-foreground italic">No content available.</p>
        )}
      </article>

      {/* Action Items Section */}
      {note.action_items && note.action_items.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Action Items
            </h2>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              {completedCount === totalCount ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  All done!
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" />
                  {completedCount} of {totalCount} complete
                </>
              )}
            </span>
          </div>

          <div className="space-y-2">
            {note.action_items.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                onStatusChange={handleActionItemChange}
              />
            ))}
          </div>
        </section>
      )}

      {/* Bottom Navigation */}
      <nav className="mt-16 pt-8 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          {previousNote ? (
            <Link
              href={`/meeting-notes/${previousNote.id}`}
              className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <ChevronLeft className="h-3 w-3" />
                Previous
              </div>
              <div className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {previousNote.title}
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextNote ? (
            <Link
              href={`/meeting-notes/${nextNote.id}`}
              className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-right"
            >
              <div className="text-xs text-muted-foreground mb-1 flex items-center justify-end gap-1">
                Next
                <ChevronRight className="h-3 w-3" />
              </div>
              <div className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {nextNote.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </nav>
    </main>
  )
}
