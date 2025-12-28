'use client'

import { ProfileWithOrganization } from '@/lib/actions/profile'
import { ProfileHeader } from './profile-header'
import { ProfileAbout } from './profile-about'
import { ProfileSkills } from './profile-skills'
import { ProfileContact } from './profile-contact'
import { ProfileActivity } from './profile-activity'
import { SocialHeader } from '@/components/social/header'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon } from 'lucide-react'

interface ProfileViewProps {
  profile: ProfileWithOrganization
  currentUserProfile?: ProfileWithOrganization | null
  isOwnProfile: boolean
  currentUserId: string
}

export function ProfileView({ profile, isOwnProfile }: ProfileViewProps) {
  // Use cover image if available, otherwise use a gradient placeholder
  const coverImage = (profile as any).cover_image_url

  return (
    <div className="min-h-screen bg-slate-50/50">
      <SocialHeader />
      
      <main className="pb-12">
        {/* Hero Section - Full Width Cover */}
        <div className="relative h-[280px] md:h-[320px] w-full group overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10">
           {coverImage ? (
             <img 
                src={coverImage} 
                alt="Cover" 
                className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
             />
           ) : (
             // Gradient fallback with pattern
             <div className="w-full h-full relative">
               <div 
                 className="absolute inset-0 opacity-30"
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                 }}
               />
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
           
           {/* Edit Cover Button */}
           {isOwnProfile && (
             <Button 
                variant="secondary" 
                size="sm" 
                className="absolute top-24 right-4 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70 border-none backdrop-blur-sm gap-2"
             >
                <ImageIcon className="h-4 w-4" />
                <span>Change Cover</span>
             </Button>
           )}
        </div>

        {/* Profile Content Container */}
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="relative -mt-[100px] mb-6">
             {/* Profile Header Card */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4 }}
               className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10"
             >
                <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
             </motion.div>
          </div>

          {/* Main Tabs Layout */}
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-white border border-slate-200 shadow-sm p-1 h-12 rounded-xl w-full md:w-auto overflow-x-auto justify-start md:justify-center">
                <TabsTrigger value="overview" className="rounded-lg px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">Overview</TabsTrigger>
                <TabsTrigger value="activity" className="rounded-lg px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">Activity</TabsTrigger>
                <TabsTrigger value="about" className="rounded-lg px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">About & Skills</TabsTrigger>
              </TabsList>
            </div>

            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="m-0 focus-visible:ring-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* Left Col: Contact & Skills */}
                   <div className="space-y-6">
                      <ProfileContact profile={profile} />
                      <div className="hidden md:block">
                        <ProfileSkills profile={profile} />
                      </div>
                   </div>
                   
                   {/* Right Col: Activity Feed */}
                   <div className="md:col-span-2 space-y-6">
                      {profile.bio && (
                         <div className="md:hidden">
                            <ProfileAbout profile={profile} />
                         </div>
                      )}
                      <ProfileActivity 
                        userId={profile.user_id} 
                        userName={profile.full_name}
                        userAvatar={profile.avatar_url || undefined}
                      />
                   </div>
                </div>
              </TabsContent>

              {/* ACTIVITY TAB */}
              <TabsContent value="activity" className="m-0 focus-visible:ring-0">
                 <div className="max-w-2xl mx-auto">
                    <ProfileActivity 
                      userId={profile.user_id}
                      userName={profile.full_name}
                      userAvatar={profile.avatar_url || undefined}
                    />
                 </div>
              </TabsContent>

              {/* ABOUT TAB */}
              <TabsContent value="about" className="m-0 focus-visible:ring-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-2 space-y-6">
                      <ProfileAbout profile={profile} />
                      <ProfileSkills profile={profile} />
                   </div>
                   <div>
                      <ProfileContact profile={profile} />
                   </div>
                </div>
              </TabsContent>
            </motion.div>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
