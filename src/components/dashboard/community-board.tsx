"use client";

import { useMemo, useState } from "react";
import { Pin, Clock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PriorityLevel = "high" | "medium" | "low";

export interface CommunityBoardItem {
  id: string;
  title: string;
  content: string;
  timeLabel: string;
  pinned: boolean;
  priority: PriorityLevel;
  author: string;
  isRead?: boolean;
  href?: string;
}

interface CommunityBoardSectionProps {
  items: CommunityBoardItem[];
  viewAllHref: string;
}

export default function CommunityBoardSection({ items, viewAllHref }: CommunityBoardSectionProps) {
  const [announcements, setAnnouncements] = useState(
    items.map((item) => ({ ...item, isRead: item.isRead ?? false }))
  );

  const unreadCount = useMemo(
    () => announcements.filter((item) => !item.isRead).length,
    [announcements],
  );

  const markAsRead = (id: string) => {
    setAnnouncements((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
  };

  const markAllAsRead = () => {
    setAnnouncements((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Community Board</h2>
          <p className="text-sm text-muted-foreground">Important updates and announcements</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
            Mark all read
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={viewAllHref}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {unreadCount === 0 ? "You're all caught up" : `${unreadCount} unread`}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-center text-sm text-muted-foreground">
            No announcements yet. Once posts are published, they will appear here.
          </div>
        ) : (
          announcements.map((announcement, index) => (
            <article
              key={announcement.id}
              className={cn(
                "cursor-pointer rounded-lg border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gentle",
                announcement.priority === "high"
                  ? "border-community/30 bg-gradient-to-r from-community-soft to-card"
                  : "border-border/50",
                announcement.pinned && "ring-1 ring-primary/20",
                !announcement.isRead && "bg-primary-soft/30",
              )}
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              onClick={() => markAsRead(announcement.id)}
            >
              <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {announcement.pinned && <Pin className="h-4 w-4 text-primary" />}
                  {getPriorityIcon(announcement.priority)}
                  <h3
                    className={cn(
                      "text-base font-semibold",
                      announcement.isRead ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {announcement.title}
                  </h3>
                  {announcement.priority === "high" && (
                    <span className="rounded-full bg-community px-2 py-1 text-xs font-medium text-community-foreground">
                      Important
                    </span>
                  )}
                  {!announcement.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <span className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {announcement.timeLabel}
                </span>
              </header>
              <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">{announcement.content}</p>
              <footer className="flex items-center justify-between text-xs text-muted-foreground">
                <span>By {announcement.author}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 capitalize",
                    announcement.priority === "high"
                      ? "bg-community-soft text-community"
                      : announcement.priority === "medium"
                        ? "bg-primary-soft text-primary"
                        : "bg-accent text-accent-foreground",
                  )}
                >
                  {announcement.priority} priority
                </span>
              </footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function getPriorityIcon(priority: PriorityLevel) {
  switch (priority) {
    case "high":
      return <AlertCircle className="h-4 w-4 text-community" />;
    case "medium":
      return <Clock className="h-4 w-4 text-primary" />;
    case "low":
      return <CheckCircle className="h-4 w-4 text-accent-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

