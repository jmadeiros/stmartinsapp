"use client"

import { Button } from "@/components/ui/button"
import { Search, Bell, User, Menu, Sparkles, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import Link from "next/link"

export function SocialHeader() {
  const pathname = usePathname()
  
  const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Chat", href: "/chat", badge: 3 },
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
      
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 relative z-10">
        {/* Left section: Logo and Navigation */}
        <div className="flex items-center gap-8">
          {/* Premium Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-primary/50 opacity-20 blur-md group-hover:opacity-30 transition-opacity" />
              <div 
                className="relative p-2 rounded-xl transition-all duration-300 shadow-lg shadow-primary/10"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.52 0.12 166 / 0.2), oklch(0.52 0.12 166 / 0.15), oklch(0.52 0.12 166 / 0.1))'
                }}
              >
                <Sparkles className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                Aitrium
                <Zap className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Oasis St Martins Village</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`
                    relative px-3 py-2 text-sm font-medium transition-colors rounded-lg
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-[var(--surface-secondary)]'
                    }
                    group
                  `}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {item.label}
                    {item.badge && (
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
        <div className="flex items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative hidden md:block w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <input
              type="search"
              placeholder="Search anything..."
              className="relative h-10 w-full rounded-xl border border-border/50 bg-[var(--surface)]/80 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-border hover:bg-[var(--surface)] transition-all duration-200"
            />
          </div>

          {/* Action Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 hover:bg-[var(--surface-secondary)] transition-colors rounded-xl"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background shadow-lg">
              5
            </span>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 hover:bg-[var(--surface-secondary)] transition-colors rounded-xl"
          >
            <User className="h-4 w-4" />
          </Button>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 hover:bg-[var(--surface-secondary)] lg:hidden rounded-xl"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export { SocialHeader as Header }
