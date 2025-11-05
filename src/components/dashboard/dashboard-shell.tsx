"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Building2, Home, MessageSquare, Calendar, Briefcase, FileText, Newspaper, Utensils, Settings, Shield } from "lucide-react";

import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserProfile = {
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  avatar_url?: string | null;
};

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresRole?: string;
}

const mainNavigation: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
  { label: "Community Board", href: "/board", icon: <MessageSquare className="h-5 w-5 flex-shrink-0" /> },
  { label: "Events Calendar", href: "/events", icon: <Calendar className="h-5 w-5 flex-shrink-0" /> },
  { label: "Jobs & Volunteering", href: "/jobs", icon: <Briefcase className="h-5 w-5 flex-shrink-0" /> },
  { label: "Community Chat", href: "/chat", icon: <MessageSquare className="h-5 w-5 flex-shrink-0" /> },
  { label: "Lunch Menu", href: "/menu", icon: <Utensils className="h-5 w-5 flex-shrink-0" /> },
  { label: "Meeting Notes", href: "/notes", icon: <FileText className="h-5 w-5 flex-shrink-0" /> },
  { label: "Media Coverage", href: "/media", icon: <Newspaper className="h-5 w-5 flex-shrink-0" /> },
];

const secondaryNavigation: NavigationItem[] = [
  { label: "Settings", href: "/settings", icon: <Settings className="h-5 w-5 flex-shrink-0" /> },
  { label: "Admin Panel", href: "/admin", icon: <Shield className="h-5 w-5 flex-shrink-0" />, requiresRole: "admin" },
];

export function DashboardShell({ user, children }: { user: UserProfile | null; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navigation = useMemo(() => ({ main: mainNavigation, secondary: secondaryNavigation }), []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col gap-8 overflow-y-auto">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-3 pt-2 text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight text-sidebar-foreground">The Village Hub</span>
                <span className="text-xs text-muted-foreground">Community platform</span>
              </div>
            </button>

            <nav className="flex flex-1 flex-col gap-6">
              <NavigationGroup items={navigation.main} pathname={pathname} />
            </nav>
          </div>

          <div className="space-y-4 pb-6">
            <div className="rounded-lg border border-sidebar-border bg-white/70 p-3 shadow-soft">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name ?? "User avatar"} />
                  <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user?.full_name ?? "Member"}</p>
                  <p className="truncate text-xs text-muted-foreground">{formatRole(user?.role)}</p>
                </div>
              </div>
            </div>

            <NavigationGroup items={navigation.secondary} pathname={pathname} userRole={user?.role ?? undefined} minimal />
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-5 py-10 md:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavigationGroup({
  items,
  pathname,
  userRole,
  minimal = false,
}: {
  items: NavigationItem[];
  pathname: string;
  userRole?: string;
  minimal?: boolean;
}) {
  const { setOpen } = useSidebar();

  return (
    <div className="space-y-2">
      {items
        .filter((item) => !item.requiresRole || item.requiresRole === userRole)
        .map((item) => (
          <SidebarLink
            key={item.href}
            link={item}
            className={cn(
              "rounded-md px-2 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent",
              pathname === item.href && "bg-sidebar-accent text-sidebar-primary",
              minimal && "px-2 py-2 text-sm",
            )}
            href={item.href}
            isActive={pathname === item.href}
            onClick={() => setOpen(false)}
          />
        ))}
    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "U";
  const [first = "", second = ""] = name.split(" ");
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}

function formatRole(role?: string | null) {
  if (!role) return "Member";
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}


