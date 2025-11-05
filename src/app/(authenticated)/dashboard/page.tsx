import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, MapPin, Briefcase, Users, Newspaper, Utensils, Bell, Search, User } from "lucide-react";
import { addDays, format, isToday, isTomorrow, startOfDay } from "date-fns";
import CommunityBoardSection from "@/components/dashboard/community-board";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostWithAuthor {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
  author?: {
    full_name: string | null;
  } | null;
  organization?: {
    name: string | null;
  } | null;
}

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  organizer?: {
    full_name: string | null;
  } | null;
}

interface JobItem {
  id: string;
  title: string;
  description: string;
  closing_date: string | null;
  organization: {
    name: string | null;
  } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: authData }, postsResult, eventsResult, jobsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(
        `id, title, content, category, is_pinned, created_at, author:users(full_name), organization:organizations(name)`
      )
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("events")
      .select(`id, title, description, location, start_time, end_time, organizer:users(full_name)`)
      .gte("end_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(6),
    supabase
      .from("jobs")
      .select(`id, title, description, closing_date, organization:organizations(name)`)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(2),
  ]);

  const user = authData?.user ?? null;

  const profile = user
    ? await supabase
        .from("users")
        .select("full_name, organization_id, role")
        .eq("id", user.id)
        .single()
        .then((res) => res.data)
    : null;

  const now = new Date();

  let allPosts = (postsResult.data as PostWithAuthor[] | null) ?? [];
  if (allPosts.length === 0) {
    allPosts = getFallbackPosts(now);
  }

  const pinnedPosts = allPosts.filter((post) => post.is_pinned);
  const latestPosts = allPosts.filter((post) => !post.is_pinned).slice(0, 5);

  let events = (eventsResult.data as EventItem[] | null) ?? [];
  if (events.length === 0) {
    events = getFallbackEvents(now);
  }
  const jobs = (jobsResult.data as JobItem[] | null) ?? [];

  const greeting = getGreeting();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const todayStart = startOfDay(now);
  const weekEnd = addDays(todayStart, 7);

  const eventsThisWeek = events.filter((event) => {
    const startDate = new Date(event.start_time);
    return startDate >= todayStart && startDate <= weekEnd;
  });

  const highlightEvents = (eventsThisWeek.length > 0 ? eventsThisWeek : events).slice(0, 3);
  const highlightBadgeText = events.length === 0
    ? "No events scheduled"
    : eventsThisWeek.length > 0
    ? `${eventsThisWeek.length} ${eventsThisWeek.length === 1 ? "event" : "events"} this week`
    : `${events.length} upcoming ${events.length === 1 ? "event" : "events"}`;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-end">
        <DashboardToolbar notifications={3} userName={profile?.full_name ?? "Alex Carter"} />
      </div>
      <WelcomeBanner greeting={greeting} firstName={firstName} now={now} />

      <WeeklyHighlights events={highlightEvents} badgeText={highlightBadgeText} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1.1fr]">
        <CommunityBoardSection
          items={buildCommunityBoardItems(pinnedPosts, latestPosts)}
          viewAllHref="/board"
        />
        <FeaturedEvents events={events} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <JobsSpotlight jobs={jobs} />
        <LunchMenuCard />
      </section>
    </div>
  );
}

function WelcomeBanner({ greeting, firstName, now }: { greeting: string; firstName: string; now: Date }) {
  return (
    <div className="rounded-xl bg-gradient-community p-8 shadow-gentle">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Today</p>
          <h1 className="mt-2 text-4xl font-bold text-foreground">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Welcome back to your community hub. Here’s what’s coming up this week.
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm text-muted-foreground">{format(now, "MMMM yyyy")}</p>
          <p className="text-2xl font-semibold text-foreground">{format(now, "EEEE, MMM d")}</p>
        </div>
      </div>
    </div>
  );
}

function WeeklyHighlights({ events, badgeText }: { events: EventItem[]; badgeText: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">This Week&apos;s Highlights</h2>
        <Badge variant="secondary" className="text-xs">
          {badgeText}
        </Badge>
      </div>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {events.map((event) => (
            <HighlightCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState message="No events scheduled for the coming week." />
      )}
    </div>
  );
}

function HighlightCard({ event }: { event: EventItem }) {
  const startDate = new Date(event.start_time);
  const badgeLabel = getHighlightLabel(startDate);
  const timeLabel = format(startDate, "h:mm a");

  return (
    <div className="group cursor-pointer rounded-lg border border-border/30 bg-gradient-gentle p-4 transition-all duration-300 hover:shadow-soft">
      <div className="mb-3 flex items-start justify-between">
        <Badge variant={badgeLabel === "Today" ? "default" : "secondary"} className="text-xs">
          {badgeLabel}
        </Badge>
        <span className="text-xs text-muted-foreground">{timeLabel}</span>
      </div>

      <h3 className="mb-2 font-medium text-foreground transition-colors group-hover:text-primary">{event.title}</h3>

      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center">
          <MapPin className="mr-1 h-3 w-3" />
          {event.location ?? "Location TBC"}
        </div>
        <div className="flex items-center">
          <Users className="mr-1 h-3 w-3" />
          {event.organizer?.full_name ? `Hosted by ${event.organizer.full_name}` : "Organizer TBC"}
        </div>
      </div>
    </div>
  );
}

function FeaturedEvents({ events }: { events: EventItem[] }) {
  if (events.length === 0) {
    return (
      <Card className="h-full border border-dashed border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle className="text-xl">Upcoming Events</CardTitle>
          <p className="text-sm text-muted-foreground">
            Nothing scheduled yet. Add an event from the calendar to feature it here.
          </p>
        </CardHeader>
        <CardContent>
          <EmptyState message="No upcoming events" />
        </CardContent>
      </Card>
    );
  }

  const featured = events[0];

  return (
    <Card className="h-full overflow-hidden border border-border/70 bg-gradient-community text-community-foreground shadow-gentle">
      <CardHeader className="space-y-3 pb-4 text-community-foreground">
        <Badge className="w-max bg-community text-community-foreground">Next up</Badge>
        <CardTitle className="text-2xl">{featured.title}</CardTitle>
        {featured.description && <p className="text-sm text-community-foreground/90">{featured.description}</p>}
      </CardHeader>
      <CardContent className="space-y-4 text-community-foreground">
        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-4 w-4" />
          {formatEventTime(featured.start_time, featured.end_time)}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="h-4 w-4" />
          {featured.location ?? "Location TBC"}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CalendarDays className="h-4 w-4" />
          Hosted by {featured.organizer?.full_name ?? "Organiser TBC"}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button asChild className="w-full bg-community text-community-foreground hover:bg-community/90">
          <a href={`/events/${featured.id}`}>View event details</a>
        </Button>
      </CardFooter>
    </Card>
  );
}

function JobsSpotlight({ jobs }: { jobs: JobItem[] }) {
  return (
    <Card className="border border-border/60 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Jobs & Volunteering</CardTitle>
          <p className="text-sm text-muted-foreground">Latest opportunities across the hub</p>
        </div>
        <Badge className="bg-primary-soft text-primary">Live</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-border/80 bg-background/60 p-4 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{job.title}</h3>
                  <p className="text-xs text-muted-foreground">{job.organization?.name ?? "Village Hub"}</p>
                </div>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                  <Briefcase className="mr-1 inline h-3 w-3" />
                  Role
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Closing {job.closing_date ? formatDate(job.closing_date) : "Open until filled"}</span>
                <a href={`/jobs/${job.id}`} className="text-primary hover:underline">
                  View posting →
                </a>
              </div>
            </div>
          ))
        ) : (
          <EmptyState message="No active opportunities – check back soon." />
        )}
      </CardContent>
      <CardFooter>
        <Button variant="secondary" className="w-full" asChild>
          <a href="/jobs">Browse all jobs</a>
        </Button>
      </CardFooter>
    </Card>
  );
}

function LunchMenuCard() {
  return (
    <Card className="border border-border/60 bg-gradient-warm shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Lunch Menu</CardTitle>
        <p className="text-sm text-muted-foreground">Daily menu provided by the community kitchen.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-white/80 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Today's Specials</h3>
            <Badge className="bg-primary-soft text-primary">
              <Utensils className="mr-1 h-3 w-3" />
              Fresh
            </Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Kitchen team is finalising today's menu. Check back shortly for details.</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Want to share menu updates? Post them to the community board under the Lunch Menu category.
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function DashboardToolbar({ notifications, userName }: { notifications: number; userName: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden w-full max-w-xs lg:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search the hub..." className="w-full pl-9" />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="relative transition-transform hover:scale-105 active:scale-95"
      >
        <Bell className="h-5 w-5" />
        {notifications > 0 && (
          <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
            {notifications}
          </Badge>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{userName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Help</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getHighlightLabel(date: Date) {
  if (isToday(date)) {
    return "Today";
  }
  if (isTomorrow(date)) {
    return "Tomorrow";
  }
  return format(date, "MMM d");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(date: Date) {
  const diff = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(days) >= 1) {
    return rtf.format(days, "day");
  }
  if (Math.abs(hours) >= 1) {
    return rtf.format(hours, "hour");
  }
  if (Math.abs(minutes) >= 1) {
    return rtf.format(minutes, "minute");
  }
  return rtf.format(seconds, "second");
}

function formatEventTime(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dateFormatter.format(startDate)} · ${timeFormatter.format(startDate)} – ${timeFormatter.format(endDate)}`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function buildCommunityBoardItems(pinned: PostWithAuthor[], latest: PostWithAuthor[]) {
  const combined = [...pinned, ...latest]
    .reduce<PostWithAuthor[]>((unique, post) => {
      if (!unique.find((item) => item.id === post.id)) {
        unique.push(post);
      }
      return unique;
    }, [])
    .slice(0, 6);

  return combined.map((post) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    timeLabel: formatRelativeTime(new Date(post.created_at)),
    pinned: post.is_pinned,
    priority: derivePriority(post),
    author: post.author?.full_name ?? "Community Member",
    isRead: false,
    href: `/board/${post.id}`,
  }));
}

function derivePriority(post: PostWithAuthor): "high" | "medium" | "low" {
  if (post.is_pinned || post.category === "announcement") {
    return "high";
  }
  if (post.category === "event") {
    return "medium";
  }
  return "low";
}

function getFallbackEvents(now: Date): EventItem[] {
  const base = startOfDay(now);

  const eventWindow = (daysAhead: number, startHour: number, durationHours: number) => {
    const start = addDays(base, daysAhead);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(startHour + durationHours, 0, 0, 0);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const garden = eventWindow(1, 14, 2);
  const bookClub = eventWindow(2, 19, 2);
  const watch = eventWindow(4, 10, 1);

  return [
    {
      id: "fallback-event-1",
      title: "Community Garden Workday",
      description: "Hands-on morning in the south garden plot.",
      location: "South Garden Plot",
      start_time: garden.start,
      end_time: garden.end,
      organizer: { full_name: "St Martins Gardening Team" },
    },
    {
      id: "fallback-event-2",
      title: "Book Club Discussion",
      description: "Weekly community book club meetup.",
      location: "Community Center",
      start_time: bookClub.start,
      end_time: bookClub.end,
      organizer: { full_name: "Community Library" },
    },
    {
      id: "fallback-event-3",
      title: "Neighborhood Watch Briefing",
      description: "Monthly coordination for volunteers.",
      location: "Main Hall",
      start_time: watch.start,
      end_time: watch.end,
      organizer: { full_name: "Safety Committee" },
    },
  ];
}

function getFallbackPosts(now: Date): PostWithAuthor[] {
  const isoDaysAgo = (daysAgo: number) => addDays(now, -daysAgo).toISOString();

  return [
    {
      id: "fallback-post-1",
      title: "Kitchen cleanup rota updated",
      content: "New rotation starts next week. Please check your assigned days in the shared calendar.",
      category: "announcement",
      is_pinned: true,
      created_at: isoDaysAgo(0.25),
      author: { full_name: "Community Manager" },
      organization: { name: "Building Coordinators" },
    },
    {
      id: "fallback-post-2",
      title: "Community meeting this Friday",
      content: "We'll discuss the upcoming renovations and summer events. Pizza provided!",
      category: "event",
      is_pinned: true,
      created_at: isoDaysAgo(1),
      author: { full_name: "Event Committee" },
      organization: { name: "Events" },
    },
    {
      id: "fallback-post-3",
      title: "Shared tools maintenance",
      content: "The workshop tools have been serviced and are ready to use again.",
      category: "general",
      is_pinned: false,
      created_at: isoDaysAgo(3),
      author: { full_name: "Maintenance Team" },
      organization: { name: "Facilities" },
    },
  ];
}

