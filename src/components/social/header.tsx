"use client"

import { Button } from "@/components/ui/button"
import { Search, Bell, User, Menu, Sparkles, Zap } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useState } from "react"

export function SocialHeader() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.98])
  const headerBlur = useTransform(scrollY, [0, 50], [8, 16])
  
  const navItems = [
    { label: "Home", active: true },
    { label: "Chats", badge: 3 },
    { label: "Calendar" },
    { label: "Opportunities" },
    { label: "People" },
    { label: "Projects" },
  ]

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl relative overflow-hidden"
      style={{ 
        opacity: headerOpacity,
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
          {/* Premium Logo with pulse animation */}
          <motion.div 
            className="flex items-center gap-2.5 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
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
                Your Brand
                <Zap className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Premium</p>
            </div>
          </motion.div>

          {/* Navigation with enhanced effects */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item, index) => (
              <motion.a
                key={item.label}
                href="#"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={`
                  relative px-3 py-2 text-sm font-medium transition-all rounded-lg
                  ${item.active 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-[var(--surface-secondary)]'
                  }
                  group
                `}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.label}
                  {item.badge && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </span>
                
                {/* Animated underline for active state */}
                {item.active && (
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
              </motion.a>
            ))}
          </nav>
        </div>

        {/* Right section: Search and Actions */}
        <div className="flex items-center gap-2.5">
          {/* Premium Search Bar */}
          <motion.div 
            className="relative hidden md:block"
            animate={{ 
              width: isSearchFocused ? 320 : 260,
              scale: isSearchFocused ? 1.02 : 1
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className={`
              absolute inset-0 rounded-xl transition-all duration-300
              ${isSearchFocused 
                ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl' 
                : 'bg-transparent'
              }
            `} />
            <Search className={`
              absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-all duration-300 z-10
              ${isSearchFocused ? 'text-primary scale-110' : 'text-muted-foreground'}
            `} />
            <input
              type="search"
              placeholder="Search anything..."
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`
                relative h-10 w-full rounded-xl border pl-10 pr-4 text-sm font-medium
                placeholder:text-muted-foreground placeholder:font-normal
                focus:outline-none transition-all duration-300
                ${isSearchFocused 
                  ? 'border-primary/50 bg-[var(--surface)] ring-2 ring-primary/20 shadow-2xl shadow-primary/20' 
                  : 'border-border/50 bg-[var(--surface)]/80 hover:border-border hover:bg-[var(--surface)]'
                }
              `}
            />
          </motion.div>

          {/* Premium Action Buttons */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 hover:bg-[var(--surface-secondary)] transition-all rounded-xl group"
            >
              <Bell className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              {/* Animated notification badge */}
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-[10px] font-bold text-primary-foreground ring-2 ring-[var(--overlay)] shadow-lg shadow-primary/50"
              >
                5
              </motion.span>
              {/* Pulse animation */}
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary animate-ping opacity-20" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-[var(--surface-secondary)] transition-all rounded-xl group"
            >
              <User className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            </Button>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-[var(--surface-secondary)] lg:hidden rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}

export { SocialHeader as Header }
