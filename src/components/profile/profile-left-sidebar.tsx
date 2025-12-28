"use client"

import { Building2, Calendar, FileText, Users, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import type { ProfileWithOrganization } from "@/lib/actions/profile"

interface ProfileLeftSidebarProps {
  profile: ProfileWithOrganization
}

export function ProfileLeftSidebar({ profile }: ProfileLeftSidebarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        {/* Profile Identity Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            className="border-0 p-6 overflow-hidden relative"
            style={{
              boxShadow: "var(--shadow-card)",
              backgroundImage:
                "linear-gradient(135deg, oklch(0.6 0.118 184.704), oklch(0.52 0.12 166 / 0.8), oklch(0.769 0.188 70.08))",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-14 w-14 ring-4 ring-white/30 shadow-lg">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                  <AvatarFallback className="text-xl font-bold bg-white/20 text-white">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                   <h2 className="text-lg font-bold leading-tight">{profile.full_name}</h2>
                   <p className="text-sm text-white/80">{profile.job_title || 'Member'}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <Building2 className="h-4 w-4 opacity-80" />
                  <span className="truncate">{profile.organization?.name || 'No Organization'}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Profile Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            className="border border-border/50 bg-[var(--surface)] p-4"
            style={{ boxShadow: "var(--shadow-surface)" }}
          >
            <div className="flex items-center gap-2 mb-4 px-1">
               <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
               </div>
               <h3 className="text-sm font-semibold">Activity Overview</h3>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <FileText className="h-4 w-4" />
                     </div>
                     <span className="text-sm font-medium">Posts</span>
                  </div>
                  <span className="text-sm font-bold">12</span>
               </div>

               <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Calendar className="h-4 w-4" />
                     </div>
                     <span className="text-sm font-medium">Events</span>
                  </div>
                  <span className="text-sm font-bold">5</span>
               </div>

               <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <Users className="h-4 w-4" />
                     </div>
                     <span className="text-sm font-medium">Connections</span>
                  </div>
                  <span className="text-sm font-bold">48</span>
               </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </aside>
  )
}
