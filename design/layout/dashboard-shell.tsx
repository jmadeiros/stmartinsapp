"use client";

import React, { createContext, useContext, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Briefcase,
  Mail,
  Info,
  Menu,
  X,
  AlertCircle,
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dashboard shell reference implementation.
 * Extracted into a separate file so you can copy pieces into live routes as needed.
 */

// ---------------------------------------------------------------------------
// Sidebar primitives
// ---------------------------------------------------------------------------

interface Links {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export function SidebarProvider({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) {
  const [openFallback, setOpenFallback] = useState(false);
  const open = openProp ?? openFallback;
  const setOpen = setOpenProp ?? setOpenFallback;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
}

export function SidebarBody(props: React.ComponentProps<typeof motion.div>) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
}

export function DesktopSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.div
      className={cn(
        "hidden h-full w-[280px] flex-shrink-0 flex-col bg-sidebar px-4 py-6 shadow-inner md:flex",
        className,
      )}
      animate={{
        width: animate ? (open ? "280px" : "68px") : "280px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MobileSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <div
        className={cn(
          "flex h-14 w-full items-center justify-between bg-sidebar px-5 shadow-sm md:hidden",
          className,
        )}
        {...props}
      >
        <Menu
          className="h-6 w-6 text-sidebar-foreground"
          onClick={() => setOpen(!open)}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 flex h-full w-full flex-col bg-background px-8 py-10"
          >
            <X
              className="absolute right-8 top-8 h-6 w-6 cursor-pointer text-muted-foreground"
              onClick={() => setOpen(false)}
            />
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function SidebarLink({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
} & React.ComponentProps<typeof Link>) {
  const { open, animate } = useSidebar();

  return (
    <Link
      href={link.href}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent",
        className,
      )}
      {...props}
    >
      <span className="flex h-5 w-5 items-center justify-center text-sidebar-primary">
        {link.icon}
      </span>
      <motion.span
        animate={{
          width: animate ? (open ? "auto" : 0) : "auto",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="overflow-hidden whitespace-nowrap"
      >
        {link.label}
      </motion.span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Dashboard demonstrations
// ---------------------------------------------------------------------------

type NoticeStatus = "urgent" | "important" | "info";

interface PriorityNotice {
  title: string;
  body: string;
  status: NoticeStatus;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  postedAgo: string;
  accent: string;
}

interface FeaturedEvent {
  whenLabel: string;
  title: string;
  description: string;
  time: string;
  location: string;
  attendees: string[];
}

const links: Links[] = [
  {
    label: "Home",
    href: "#",
    icon: <Home className="h-5 w-5" />,
  },
  {
    label: "Services",
    href: "#",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    label: "Contact",
    href: "#",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    label: "About",
    href: "#",
    icon: <Info className="h-5 w-5" />,
  },
];

const notices: PriorityNotice[] = [
  {
    title: "Road Closure Alert",
    body: "Main Street will be closed for maintenance from 8 AM – 5 PM tomorrow.",
    status: "urgent",
    icon: AlertCircle,
    postedAgo: "2 hours ago",
    accent: "from-red-500/80 to-red-300/40",
  },
  {
    title: "Community Meeting Tomorrow",
    body: "Monthly community meeting at 7 PM. RSVP to receive the agenda.",
    status: "important",
    icon: CalendarDays,
    postedAgo: "5 hours ago",
    accent: "from-orange-400/80 to-orange-200/40",
  },
  {
    title: "New Recycling Program",
    body: "Starting next month. Check your mailbox for the new schedule.",
    status: "info",
    icon: Mail,
    postedAgo: "1 day ago",
    accent: "from-emerald-400/80 to-emerald-200/40",
  },
];

const featuredEvent: FeaturedEvent = {
  whenLabel: "Tomorrow",
  title: "Community Cleanup",
  description: "Join us for our monthly neighborhood cleanup event.",
  time: "9:00 AM – 12:00 PM",
  location: "Central Park",
  attendees: ["U1", "U2", "U3"],
};

const statusLabel: Record<NoticeStatus, string> = {
  urgent: "Urgent",
  important: "Important",
  info: "Info",
};

const statusClass: Record<NoticeStatus, string> = {
  urgent: "bg-destructive text-destructive-foreground",
  important: "bg-community text-community-foreground",
  info: "bg-primary-soft text-primary",
};

function PriorityNoticeCard({ notice }: { notice: PriorityNotice }) {
  const Icon = notice.icon;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/80 bg-card/90 shadow-soft transition hover:shadow-hover",
        "before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-gradient-to-b",
        notice.accent,
      )}
    >
      <CardContent className="flex gap-4 px-5 py-5">
        <span className="mt-1 rounded-full bg-muted p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{notice.title}</h3>
            <Badge className={statusClass[notice.status]}>{statusLabel[notice.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{notice.body}</p>
          <p className="text-xs text-muted-foreground/70">{notice.postedAgo}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedEventCard({ event }: { event: FeaturedEvent }) {
  return (
    <Card className="h-full overflow-hidden border border-border/70 bg-gradient-community">
      <CardHeader className="space-y-3 pb-4">
        <Badge className="w-max bg-community text-community-foreground">{event.whenLabel}</Badge>
        <CardTitle className="text-2xl">{event.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{event.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          {event.time}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {event.location}
        </div>
        <div className="flex items-center gap-2">
          {event.attendees.map((initials) => (
            <span
              key={initials}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-medium text-primary"
            >
              {initials}
            </span>
          ))}
          <span className="text-xs text-muted-foreground">24 attending</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full">Join Event</Button>
      </CardFooter>
    </Card>
  );
}

function PriorityNoticesSection() {
  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Priority Notices</h2>
        <Link href="#" className="text-sm font-medium text-primary hover:underline">
          View all →
        </Link>
      </header>
      <div className="space-y-3">
        {notices.map((notice) => (
          <PriorityNoticeCard key={notice.title} notice={notice} />
        ))}
      </div>
    </section>
  );
}

export function DashboardShellDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col gap-10 overflow-y-auto">
            <div className="mt-6 space-y-4">
              {links.map((link) => (
                <SidebarLink key={link.label} link={link} />
              ))}
            </div>
          </div>
          <div className="pb-6">
            <SidebarLink
              link={{
                label: "Community Hub",
                href: "#",
                icon: <div className="h-8 w-8 rounded-full bg-primary" />,
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10">
          <header className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-4xl font-bold text-foreground"
            >
              Welcome back, neighbor 👋
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Here’s what’s happening in your community hub today.
            </motion.p>
          </header>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1.2fr]"
          >
            <PriorityNoticesSection />
            <FeaturedEventCard event={featuredEvent} />
          </motion.section>
        </div>
      </main>
    </div>
  );
}
