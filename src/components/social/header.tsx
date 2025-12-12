"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, Bell, User, Menu, Sparkles, Zap, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getUnreadNotificationCount } from "@/lib/actions/notifications"
import { getUnreadChatCount } from "@/lib/actions/chat"
import { createClient } from "@/lib/supabase/client"
import { NotificationsDropdown } from "./notifications-dropdown"

export function SocialHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [chatCount, setChatCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  
  // Fetch badge counts
  useEffect(() => {
    async function fetchBadgeCounts() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      setUserId(user.id)

      // Fetch notification count
      const notificationResult = await getUnreadNotificationCount(user.id)
      if (notificationResult.success) {
        setNotificationCount(notificationResult.count)
      }

      // Fetch chat count
      const chatResult = await getUnreadChatCount(user.id)
      if (chatResult.success) {
        setChatCount(chatResult.count)
      }
    }

    fetchBadgeCounts()

    // Optionally refresh counts periodically
    const interval = setInterval(fetchBadgeCounts, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Auto-collapse search on resize if we're on desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setSearchExpanded(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Chat", href: "/chat", badge: chatCount },
    { label: "Calendar", href: "/calendar" },
    { label: "Opportunities", href: "/opportunities" },
    { label: "People", href: "/people" },
    { label: "Projects", href: "/projects" },
  ]

  return (
    <header 
      className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl relative overflow-hidden"
      style={{ 
        backgroundColor: 'oklch(1 0 0 / 0.95)'
      }}
    >
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none animate-gradient" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, oklch(0.52 0.12 166 / 0.1), oklch(0.52 0.12 166 / 0.05), transparent)',
          backgroundSize: '200% 200%'
        }}
      />
      
      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-1000" 
           style={{ transform: 'translateX(-100%)' }} />
      
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-2 sm:px-4 relative z-10 gap-2">
        {/* Left section: Logo and Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-shrink">
          {/* Premium Logo */}
          <Link href="/dashboard" className="flex items-center gap-1 sm:gap-1.5 md:gap-2.5 group cursor-pointer flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-primary/50 opacity-20 blur-md group-hover:opacity-30 transition-opacity" />
              <div 
                className="relative p-1.5 sm:p-2 rounded-xl transition-all duration-300 shadow-lg shadow-primary/10"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.52 0.12 166 / 0.2), oklch(0.52 0.12 166 / 0.15), oklch(0.52 0.12 166 / 0.1))'
                }}
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-base sm:text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span className="truncate">Aitrium</span>
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </h1>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider hidden lg:block">Oasis St Martins Village</p>
            </div>
          </Link>

          {/* Navigation - Hidden only on very small mobile, visible on iPad+ */}
          <nav className="hidden items-center gap-0.5 md:gap-1 lg:gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`
                    relative px-2 md:px-2.5 lg:px-3 py-2 text-sm font-medium transition-colors rounded-lg
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-[var(--surface-secondary)]'
                    }
                    group
                  `}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/30">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  
                  {/* Animated underline for active state */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{
                        background: 'linear-gradient(to right, oklch(0.52 0.12 166 / 0.5), oklch(0.52 0.12 166), oklch(0.52 0.12 166 / 0.5))'
                      }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right section: Search and Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 flex-shrink-0">
          {/* Search Bar - Button on tablet, full bar on desktop */}
          <div className="relative hidden sm:block">
            {/* Tablet: Show as button when collapsed, expand on click/focus */}
            {!searchExpanded ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchExpanded(true)}
                className="md:flex lg:hidden h-9 w-9 min-h-[44px] min-w-[44px] hover:bg-[var(--surface-secondary)] rounded-xl"
              >
                <Search className="h-4 w-4" />
              </Button>
            ) : (
              <motion.div
                initial={{ width: 40 }}
                animate={{ width: 240 }}
                exit={{ width: 40 }}
                className="relative md:block lg:hidden"
              >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                <input
                  type="search"
                  placeholder="Search..."
                  autoFocus
                  onBlur={() => {
                    // Small delay to allow clicking on results
                    setTimeout(() => {
                      if (window.innerWidth < 1024) {
                        setSearchExpanded(false)
                      }
                    }, 200)
                  }}
                  className="relative h-9 w-full rounded-xl border border-border/50 bg-[var(--surface)]/80 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-border hover:bg-[var(--surface)] transition-all duration-200"
                />
              </motion.div>
            )}
            
            {/* Desktop: Always show full search bar */}
            <div className="hidden lg:block">
              <div className="relative w-[180px] xl:w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="relative h-10 w-full rounded-xl border border-border/50 bg-[var(--surface)]/80 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-border hover:bg-[var(--surface)] transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Small screens: Show compact search bar */}
            <div className="relative sm:block md:hidden">
              <div className="relative w-[140px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="relative h-9 w-full rounded-xl border border-border/50 bg-[var(--surface)]/80 pl-10 pr-2 text-xs font-medium placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-border hover:bg-[var(--surface)] transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Search Icon Button - Very small screens only */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:hidden min-h-[44px] min-w-[44px] hover:bg-[var(--surface-secondary)] rounded-xl"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Action Buttons - minimum 44x44px on mobile/tablet */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] hover:bg-[var(--surface-secondary)] transition-colors rounded-xl"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background shadow-lg">
                  {notificationCount}
                </span>
              )}
            </Button>
            <NotificationsDropdown
              userId={userId}
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
            />
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] hover:bg-[var(--surface-secondary)] transition-colors rounded-xl"
          >
            <User className="h-4 w-4" />
          </Button>

          {/* Mobile Menu Button - Only show on very small screens */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] hover:bg-[var(--surface-secondary)] md:hidden rounded-xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 xl:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-border/40 shadow-xl z-50 xl:hidden overflow-y-auto"
            >
              <div className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors
                        ${isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-[var(--surface-secondary)]'
                        }
                      `}
                    >
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

export { SocialHeader as Header }
