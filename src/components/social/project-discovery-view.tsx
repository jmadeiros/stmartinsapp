"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Heart, 
  DollarSign, 
  Building2, 
  Users, 
  MapPin, 
  ArrowRight, 
  Filter,
  Sparkles,
  Zap,
  Leaf,
  Activity,
  Trophy,
  Megaphone,
  Clock
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import type { ProjectPost } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProjectDiscoveryViewProps {
  initialProjects: ProjectPost[]
  userOrgId?: string
}

type FilterMode = "all" | "volunteer" | "donate" | "partner"

export function ProjectDiscoveryView({ initialProjects, userOrgId }: ProjectDiscoveryViewProps) {
  const router = useRouter()
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)

  // Scroll listener for sticky nav effects
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Filter Logic
  const filteredProjects = initialProjects.filter(project => {
    // Search Filter
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.cause?.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    // Intent Filter
    if (filterMode === "volunteer") return !!project.needs?.volunteersNeeded
    if (filterMode === "donate") return !!project.needs?.fundraisingGoal || (project.needs?.resourcesRequested?.length || 0) > 0
    if (filterMode === "partner") return !!project.needs?.seekingPartners
    
    return true
  })

  // Stats for "Village Pulse"
  const activeProjects = initialProjects.length
  const totalPartners = initialProjects.reduce((acc, p) => acc + (p.collaborations?.length || 0), 0) + 15
  const peopleReached = "1.2k"
  const spotlightProject = filteredProjects[0] || initialProjects[0]

  return (
    <div className="min-h-screen bg-slate-50/50 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      
      {/* 1. Light & Airy Hero Section */}
      <div className="relative w-full bg-white border-b border-slate-100 pb-16 pt-12 overflow-hidden max-w-full">
        
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-50/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-50/30 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          
          {/* Header Title Area */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                The Village Pulse
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Connect with local initiatives that need your help right now. 
                Discover projects, track impact, and join the movement.
              </p>
            </div>

             {/* Search & Action */}
             <div className="w-full lg:w-auto flex flex-col gap-3 min-w-0 max-w-full">
                <div className="relative group w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search causes, skills, or needs..." 
                    className="w-full max-w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pl-10 pr-4 py-2.5 text-sm rounded-xl shadow-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                     <Filter className="h-4 w-4 mr-2" />
                     Advanced
                  </Button>
                  <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200">
                     Start Project
                  </Button>
                </div>
            </div>
          </div>

          {/* New Feature: Live Activity Ticker */}
          <div className="mb-12 border-y border-slate-100 bg-slate-50/50 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-4 overflow-hidden">
             <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
               <Activity className="h-3.5 w-3.5 text-emerald-500" />
               Latest Activity
             </div>
             <div className="flex items-center animate-marquee whitespace-nowrap">
                <div className="flex items-center gap-8 pr-8">
                  <TickerItem text="Sarah J. volunteered for Urban Garden" time="2m ago" />
                  <TickerItem text="TechCorp pledged 5 laptops to Youth Code" time="5m ago" />
                  <TickerItem text="New Project: 'Clean River Initiative' started" time="12m ago" />
                  <TickerItem text="St. Martins reached 500 meals served" time="1h ago" />
                  <TickerItem text="Community Center raised $1,200" time="2h ago" />
                </div>
                {/* Duplicate for seamless loop */}
                <div className="flex items-center gap-8 pr-8">
                  <TickerItem text="Sarah J. volunteered for Urban Garden" time="2m ago" />
                  <TickerItem text="TechCorp pledged 5 laptops to Youth Code" time="5m ago" />
                  <TickerItem text="New Project: 'Clean River Initiative' started" time="12m ago" />
                  <TickerItem text="St. Martins reached 500 meals served" time="1h ago" />
                  <TickerItem text="Community Center raised $1,200" time="2h ago" />
                </div>
             </div>
          </div>

          {/* Stats Grid - Cleaner, Minimal - Stack on mobile, 2x2 on tablet, 4 columns on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-12">
             <StatCard 
               value={activeProjects} 
               label="Active Projects" 
               trend="+2 this week"
               icon={Zap}
               color="emerald"
             />
             <StatCard 
               value={peopleReached} 
               label="People Impacted" 
               trend="12% increase"
               icon={Users}
               color="blue"
             />
             <StatCard 
               value={totalPartners} 
               label="Partners Engaged" 
               trend="Growing fast"
               icon={Building2}
               color="purple"
             />
             <StatCard 
               value="100%" 
               label="Funds to Cause" 
               trend="Verified"
               icon={Trophy}
               color="amber"
             />
          </div>

          {/* Featured Spotlight - Magazine Style */}
          {spotlightProject && !searchQuery && (
             <div 
               className="group relative rounded-3xl overflow-hidden cursor-pointer bg-white border border-slate-200 shadow-xl shadow-slate-100/50 transition-all hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1"
               onClick={() => router.push(`/projects/${spotlightProject.id}`)}
             >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Sparkles className="h-48 w-48 text-emerald-500 rotate-12" />
                </div>
                
                <div className="flex flex-col md:flex-row">
                   {/* Left: Content */}
                   <div className="p-8 md:p-10 flex-1 relative z-10">
                      <div className="flex items-center gap-3 mb-5">
                         <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 px-3 py-1 font-medium">
                            Editor&apos;s Choice
                         </Badge>
                         <span className="text-sm font-medium text-slate-500">
                            Updates 2h ago
                         </span>
                      </div>
                      
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 leading-tight">
                         {spotlightProject.title}
                      </h2>
                      <p className="text-base text-slate-600 mb-6 max-w-xl leading-relaxed">
                         {spotlightProject.description}
                      </p>
                      
                      <div className="flex items-center gap-6">
                         <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-4 ring-slate-50">
                               <AvatarImage src={spotlightProject.author.avatar} />
                               <AvatarFallback>{spotlightProject.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                               <div className="text-sm font-semibold text-slate-900">{spotlightProject.author.organization}</div>
                               <div className="text-xs text-slate-500">Project Lead</div>
                            </div>
                         </div>
                         <div className="h-8 w-px bg-slate-200"></div>
                         <Button variant="link" className="text-emerald-600 font-semibold p-0 h-auto hover:text-emerald-700 text-sm">
                            Read full story <ArrowRight className="ml-1 h-4 w-4" />
                         </Button>
                      </div>
                   </div>

                   {/* Right: Visual Stats sidebar */}
                   <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-8 md:p-10 w-full md:w-80 flex flex-col justify-center gap-6">
                      <div>
                         <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Impact Goal</div>
                         <div className="font-medium text-slate-900 text-base leading-snug">{spotlightProject.impactGoal}</div>
                      </div>
                      
                      <div className="space-y-3 min-w-0">
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Progress</span>
                            <span className="font-bold text-slate-900">35%</span>
                         </div>
                         <div className="h-2 bg-slate-200 rounded-full overflow-hidden w-full">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '35%', maxWidth: '100%' }}></div>
                         </div>
                      </div>

                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl font-semibold shadow-lg shadow-emerald-200/50 text-sm">
                         Support Project
                      </Button>
                   </div>
                </div>
             </div>
          )}

        </div>
      </div>

      {/* 2. Content Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Sticky Filters Nav */}
        <div className={cn("sticky top-0 z-30 py-4 transition-all -mx-4 px-4 mb-8", isScrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm" : "")}>
           <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex p-1 bg-slate-100/80 rounded-xl">
                  <FilterTab 
                     active={filterMode === "all"} 
                     onClick={() => setFilterMode("all")}
                     label="All Projects"
                  />
                  <FilterTab 
                     active={filterMode === "volunteer"} 
                     onClick={() => setFilterMode("volunteer")}
                     label="Volunteer"
                     count={initialProjects.reduce((acc, p) => acc + (p.needs?.volunteersNeeded ? 1 : 0), 0)}
                  />
                  <FilterTab 
                     active={filterMode === "donate"} 
                     onClick={() => setFilterMode("donate")}
                     label="Donate"
                  />
                  <FilterTab 
                     active={filterMode === "partner"} 
                     onClick={() => setFilterMode("partner")}
                     label="Partner"
                  />
              </div>

              <div className="flex items-center text-sm text-slate-500 font-medium">
                 Showing {filteredProjects.length} initiatives
              </div>
           </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No projects found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">We couldn&apos;t find any projects matching your current filters. Try adjusting your search.</p>
            <Button variant="outline" onClick={() => {setFilterMode("all"); setSearchQuery("")}}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <motion.div
                  layout
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <ModernProjectCard 
                    project={project} 
                    mode={filterMode} 
                    onClick={() => router.push(`/projects/${project.id}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}

// --- Components ---

function TickerItem({ text, time }: { text: string, time: string }) {
   return (
      <div className="flex items-center gap-2 text-xs text-slate-600">
         <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
         <span className="font-medium">{text}</span>
         <span className="text-slate-400 text-[10px]">{time}</span>
      </div>
   )
}

function StatCard({ value, label, trend, icon: Icon, color }: any) {
   const colorStyles = {
      emerald: "text-emerald-600 bg-emerald-50",
      blue: "text-blue-600 bg-blue-50",
      purple: "text-purple-600 bg-purple-50",
      amber: "text-amber-600 bg-amber-50",
   }[color as string] || "text-slate-600 bg-slate-50"

   return (
      <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
         <div className="flex items-start justify-between mb-3">
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", colorStyles)}>
               <Icon className="h-4.5 w-4.5" />
            </div>
            <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-medium text-[10px] px-2">
               {trend}
            </Badge>
         </div>
         <div className="text-xl font-bold text-slate-900 mb-0.5">{value}</div>
         <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
   )
}

function FilterTab({ active, onClick, label, count }: any) {
   return (
      <button
         onClick={onClick}
         className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative",
            active 
               ? "bg-white text-slate-900 shadow-sm"
               : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
         )}
      >
         {label}
         {count !== undefined && count > 0 && (
            <span className={cn(
               "ml-1.5 text-[10px] py-0.5 px-1.5 rounded-full",
               active ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
            )}>
               {count}
            </span>
         )}
      </button>
   )
}

function ModernProjectCard({ project, mode, onClick }: { project: ProjectPost, mode: FilterMode, onClick: () => void }) {
  const highlightVolunteer = mode === "volunteer" || (mode === "all" && project.needs?.volunteersNeeded);
  const highlightDonate = mode === "donate" || (mode === "all" && (project.needs?.fundraisingGoal || project.needs?.resourcesRequested));
  const highlightPartner = mode === "partner" || (mode === "all" && project.needs?.seekingPartners);

  return (
    <Card 
      className="group h-full flex flex-col overflow-hidden bg-white border-slate-200 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-28 bg-slate-100 overflow-hidden">
         {/* Abstract Card Header Pattern */}
         <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200/50" />
         <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 backdrop-blur text-slate-700 shadow-sm border-0 font-semibold hover:bg-white text-[10px] px-2 py-0.5">
               {project.cause}
            </Badge>
         </div>
      </div>
      
      <div className="px-5 relative">
         <div className="-mt-7 mb-3">
            <Avatar className="h-12 w-12 ring-4 ring-white shadow-md">
               <AvatarImage src={project.author.avatar} />
               <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{project.author.name[0]}</AvatarFallback>
            </Avatar>
         </div>

         <div className="mb-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
               {project.author.organization}
            </div>
            <h3 className="font-bold text-base text-slate-900 leading-snug mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
               {project.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
               {project.description}
            </p>
         </div>

         {/* Contextual Action Area */}
         <div className="mb-5 space-y-2">
            {highlightVolunteer && project.needs?.volunteersNeeded && (
               <div className="flex items-center gap-2.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50">
                  <Heart className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-semibold">Need {project.needs.volunteersNeeded} Volunteers</span>
               </div>
            )}
             {highlightDonate && project.needs?.fundraisingGoal && (
               <div className="flex items-center gap-2.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-semibold">Goal: {project.needs.fundraisingGoal}</span>
               </div>
            )}
             {highlightPartner && project.needs?.seekingPartners && (
               <div className="flex items-center gap-2.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100/50">
                  <Building2 className="h-3.5 w-3.5 text-purple-600" />
                  <span className="font-semibold">Seeking Partners</span>
               </div>
            )}
         </div>
      </div>

      <div className="mt-auto px-5 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
         <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-slate-400" />
            {project.serviceArea || "Local"}
         </div>
         <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-400" />
            {project.timeAgo}
         </div>
      </div>
    </Card>
  )
}
