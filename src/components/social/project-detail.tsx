"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, 
  Target, 
  Users, 
  Building2, 
  Package, 
  DollarSign, 
  Heart, 
  Share2, 
  MoreHorizontal,
  MapPin,
  Clock,
  Check,
  ArrowRight,
  TrendingUp,
  Activity,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentBadge } from "@/components/ui/content-badge"
import { InterestCounter } from "@/components/ui/interest-counter"
import { CommentSection } from "./comment-section"
import { CollaboratorManagement } from './collaborator-management'
import type { ProjectPost } from "@/lib/types"
import { cn } from "@/lib/utils"

type ProjectSupportResponse = {
  volunteer: boolean
  bringParticipants: boolean
  participantCount: string
  canPartner: boolean
  provideResources: boolean
  contributeFunding: boolean
}

interface ProjectDetailProps {
  project: ProjectPost
  currentUserId: string
  currentUserOrgId: string
}

export function ProjectDetail({ project, currentUserId, currentUserOrgId }: ProjectDetailProps) {
  const [interested, setInterested] = useState(false)

  // Check if current user's org owns this project
  const isOwner = project.org_id === currentUserOrgId

  // Collaboration display logic
  const collaborations = project.collaborations ?? []
  
  const hasNeeds =
    !!project.needs &&
    (!!project.needs.volunteersNeeded ||
      (project.needs.participantRequests && project.needs.participantRequests.length > 0) ||
      project.needs.seekingPartners ||
      (project.needs.resourcesRequested && project.needs.resourcesRequested.length > 0) ||
      !!project.needs.fundraisingGoal)

  const progressPercent = project.progress 
    ? Math.min((project.progress.current / project.progress.target) * 100, 100) 
    : 0

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 1. Immersive Hero Section */}
      <div className="relative w-full bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 p-32 bg-emerald-500/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 p-24 bg-teal-500/20 blur-[100px] rounded-full mix-blend-screen"></div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24 flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border-0 backdrop-blur-sm">
                Active Initiative
              </Badge>
              {project.cause && (
                <Badge variant="outline" className="border-white/20 text-emerald-50">
                  {project.cause}
                </Badge>
              )}
              {project.serviceArea && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-100/80">
                  <MapPin className="h-4 w-4" />
                  {project.serviceArea}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              {project.title}
            </h1>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-3">
                <Avatar className="h-12 w-12 ring-4 ring-emerald-950/50">
                  <AvatarImage src={project.author.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-emerald-800 text-emerald-100">{project.author.name[0]}</AvatarFallback>
                </Avatar>
                {collaborations.slice(0, 3).map((collab, i) => (
                  <Avatar key={i} className="h-12 w-12 ring-4 ring-emerald-950/50">
                    <AvatarImage src={collab.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-teal-800 text-teal-100">{collab.organization[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-medium text-emerald-50">Led by {project.author.organization}</p>
                <p className="text-emerald-200/70">
                  with {collaborations.length > 0 ? `${collaborations.length} partners` : "community support"}
                </p>
              </div>
            </div>
          </div>

          {/* Hero Impact Card */}
          <div className="w-full max-w-md shrink-0">
             <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-2">Our Impact Goal</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {project.impactGoal}
                  </p>
                </div>
                
                {project.progress && (
                  <div className="space-y-3 pt-2">
                     <div className="flex justify-between items-end">
                        <span className="text-3xl font-bold text-emerald-400">{project.progress.current}</span>
                        <span className="text-sm font-medium text-emerald-100/70 mb-1">
                          of {project.progress.target} {project.progress.unit}
                        </span>
                     </div>
                     <Progress value={progressPercent} className="h-3 bg-white/10" indicatorClassName="bg-emerald-400" />
                     <p className="text-xs text-right text-emerald-200/50">
                       Last updated {project.progress.lastUpdated || "recently"}
                     </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button 
                    size="lg" 
                    className="w-full bg-white text-emerald-900 hover:bg-emerald-50 font-bold h-12 text-base shadow-xl transition-transform hover:scale-[1.02]"
                    onClick={() => {
                        const el = document.getElementById('action-center');
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Get Involved
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Column (Left) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Context/Story Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
               <div className="p-6 sm:p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">The Story</h2>
                  <div className="prose prose-lg text-muted-foreground max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed">{project.description}</p>
                  </div>
               </div>
               
               {/* Quick Stats Grid */}
               <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-t border-border bg-muted/30">
                  <div className="p-4 text-center">
                    <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Posted</div>
                    <div className="font-semibold">{project.timeAgo}</div>
                  </div>
                  <div className="p-4 text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Target</div>
                    <div className="font-semibold">{project.targetDate || "Ongoing"}</div>
                  </div>
                  <div className="p-4 text-center">
                    <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Team</div>
                    <div className="font-semibold">{1 + collaborations.length} Orgs</div>
                  </div>
                  <div className="p-4 text-center">
                    <Activity className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Status</div>
                    <div className="font-semibold text-emerald-600">Active</div>
                  </div>
               </div>
            </div>

            {/* Updates Timeline */}
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-bold text-foreground">Project Updates</h2>
                 <Button variant="outline" size="sm">View All</Button>
               </div>
               
               {/* Placeholder Timeline Items */}
               <div className="relative pl-8 border-l-2 border-muted space-y-10">
                  <div className="relative">
                     <div className="absolute -left-[39px] bg-background p-1">
                        <div className="h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
                     </div>
                     <div className="bg-card p-5 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-sm font-bold text-emerald-700">Milestone Reached</span>
                           <span className="text-xs text-muted-foreground">2 days ago</span>
                        </div>
                        <p className="text-sm text-foreground">We&apos;ve successfully secured the location for our main event! Thanks to the City Council for their partnership.</p>
                     </div>
                  </div>

                  <div className="relative">
                     <div className="absolute -left-[39px] bg-background p-1">
                        <div className="h-4 w-4 rounded-full bg-muted-foreground ring-4 ring-muted"></div>
                     </div>
                     <div className="bg-card p-5 rounded-xl border shadow-sm opacity-80">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-sm font-bold text-foreground">Kickoff Meeting</span>
                           <span className="text-xs text-muted-foreground">1 week ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Initial planning phase completed. We are now moving to resource gathering.</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Comments Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <div className="p-6 sm:p-8">
                <CommentSection
                  resourceType="project"
                  resourceId={project.id}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </div>

          {/* Action & Sidebar Column (Right) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* "The Ask" - Sticky Action Center */}
            <div id="action-center" className="bg-card rounded-2xl shadow-lg border-2 border-emerald-100 overflow-hidden sticky top-24">
              <div className="bg-emerald-50/50 p-6 border-b border-emerald-100">
                <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                   <Target className="h-5 w-5 text-emerald-600" />
                   What We Need Now
                </h3>
                <p className="text-sm text-emerald-800/70 mt-1">Select an item to pledge your support.</p>
              </div>
              
              <div className="p-2">
                {project.needs?.volunteersNeeded && (
                  <button 
                    onClick={() => setInterested(!interested)}
                    className="w-full text-left p-4 hover:bg-emerald-50 rounded-xl transition-colors group flex items-start gap-4"
                  >
                    <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-0.5">
                         <span className="font-semibold text-foreground group-hover:text-emerald-900">Volunteers</span>
                         <Badge variant="secondary" className="bg-white group-hover:bg-emerald-200/50 text-xs">
                           Need {project.needs.volunteersNeeded}
                         </Badge>
                       </div>
                       <p className="text-xs text-muted-foreground leading-snug">Help us run the event on the ground.</p>
                    </div>
                  </button>
                )}
                
                {project.needs?.seekingPartners && (
                  <button 
                    onClick={() => setInterested(!interested)}
                    className="w-full text-left p-4 hover:bg-emerald-50 rounded-xl transition-colors group flex items-start gap-4"
                  >
                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-0.5">
                         <span className="font-semibold text-foreground group-hover:text-emerald-900">Partners</span>
                         <Badge variant="secondary" className="bg-white group-hover:bg-emerald-200/50 text-xs">
                           Open
                         </Badge>
                       </div>
                       <p className="text-xs text-muted-foreground leading-snug">Collaborate with your organization.</p>
                    </div>
                  </button>
                )}

                {project.needs?.resourcesRequested && (
                   <button 
                    onClick={() => setInterested(!interested)}
                    className="w-full text-left p-4 hover:bg-emerald-50 rounded-xl transition-colors group flex items-start gap-4"
                   >
                    <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-0.5">
                         <span className="font-semibold text-foreground group-hover:text-emerald-900">Resources</span>
                         <Badge variant="secondary" className="bg-white group-hover:bg-emerald-200/50 text-xs">
                           {project.needs.resourcesRequested.length} Items
                         </Badge>
                       </div>
                       <p className="text-xs text-muted-foreground leading-snug">
                         Donate {project.needs.resourcesRequested.slice(0,2).join(", ")}...
                       </p>
                    </div>
                  </button>
                )}

                {project.needs?.fundraisingGoal && (
                   <button 
                    onClick={() => setInterested(!interested)}
                    className="w-full text-left p-4 hover:bg-emerald-50 rounded-xl transition-colors group flex items-start gap-4"
                   >
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-0.5">
                         <span className="font-semibold text-foreground group-hover:text-emerald-900">Funding</span>
                         <Badge variant="secondary" className="bg-white group-hover:bg-emerald-200/50 text-xs">
                           {project.needs.fundraisingGoal}
                         </Badge>
                       </div>
                       <p className="text-xs text-muted-foreground leading-snug">Help us reach our financial goal.</p>
                    </div>
                  </button>
                )}
              </div>
              
              <div className="p-4 bg-muted/20 border-t border-border">
                {interested ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm font-medium text-emerald-800 mb-2">Thanks for your interest!</p>
                    <p className="text-xs text-emerald-600 mb-3">We&apos;ll be in touch soon.</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full bg-white text-xs h-8"
                      onClick={() => setInterested(false)}
                    >
                      Undo
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-md" onClick={() => setInterested(true)}>
                    I want to help generally
                  </Button>
                )}
              </div>
            </div>

            {/* Community/Social Proof */}
            <Card className="p-6">
               <h3 className="font-semibold mb-4 flex items-center justify-between">
                 <span>Community</span>
                 <span className="text-xs font-normal text-muted-foreground">
                   {project.interestedOrgs?.length || 0} interested
                 </span>
               </h3>

               <div className="flex -space-x-2 overflow-hidden mb-4">
                  {[1,2,3,4,5].map((_, i) => (
                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                       {String.fromCharCode(65+i)}
                    </div>
                  ))}
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    +12
                  </div>
               </div>

               <p className="text-xs text-muted-foreground leading-relaxed">
                 Join <strong>St. Martins Village</strong>, <strong>Local Library</strong>, and 12 others in supporting this cause.
               </p>
            </Card>

            {/* Collaborators Section */}
            {project.collaboratorOrgs && project.collaboratorOrgs.length > 0 && (
              <CollaboratorManagement
                resourceType="project"
                resourceId={project.id}
                ownerOrgId={project.org_id || ''}
                currentUserOrgId={currentUserOrgId}
                collaborators={project.collaboratorOrgs}
                isOwner={isOwner}
                onCollaboratorRemoved={() => {
                  window.location.reload()
                }}
              />
            )}

            {/* Admin/Share Tools */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full gap-2">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <MessageSquare className="h-4 w-4" /> Message
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
