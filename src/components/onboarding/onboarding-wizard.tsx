'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronRight, User, Building2, Sparkles, Bell, Loader2, Camera, Linkedin, Globe, Twitter } from 'lucide-react'
import { uploadAvatar } from '@/lib/actions/storage'
import { cn } from '@/lib/utils'
import {
  saveProfileStep,
  saveOrganizationStep,
  saveInterestsStep,
  completeOnboarding,
  type ProfileStepData,
  type OrganizationStepData,
  type InterestsStepData,
  type NotificationStepData,
} from '@/lib/actions/onboarding'
import { useToast } from '@/components/ui/use-toast'

interface Organization {
  id: string
  name: string
  slug: string | null
  description: string | null
  logo_url: string | null
}

interface OnboardingWizardProps {
  userId: string
  userEmail: string
  organizations: Organization[]
  existingProfile?: {
    full_name: string | null
    bio: string | null
    job_title: string | null
    organization_id: string | null
    skills: string[] | null
    interests: string[] | null
    avatar_url: string | null
    linkedin_url: string | null
    twitter_url: string | null
    website_url: string | null
  } | null
}

const steps = [
  { id: 1, title: 'Profile', icon: User },
  { id: 2, title: 'Organization', icon: Building2 },
  { id: 3, title: 'Interests', icon: Sparkles },
  { id: 4, title: 'Notifications', icon: Bell },
]

const skillOptions = [
  'Project Management', 'Fundraising', 'Marketing', 'Communications',
  'Event Planning', 'Volunteer Coordination', 'Finance', 'Legal',
  'Technology', 'Design', 'Content Writing', 'Social Media',
  'Community Outreach', 'Grant Writing', 'Data Analysis', 'HR'
]

const interestOptions = [
  'Education', 'Health & Wellbeing', 'Environment', 'Arts & Culture',
  'Youth Development', 'Elder Care', 'Housing', 'Food Security',
  'Mental Health', 'Employment', 'Social Justice', 'Animal Welfare',
  'Disability Support', 'Homelessness', 'Refugees', 'Domestic Violence'
]

export function OnboardingWizard({
  userId,
  userEmail,
  organizations,
  existingProfile,
}: OnboardingWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Step 1: Profile data
  const [profileData, setProfileData] = useState<ProfileStepData>({
    full_name: existingProfile?.full_name || '',
    bio: existingProfile?.bio || '',
    job_title: existingProfile?.job_title || '',
    avatar_url: existingProfile?.avatar_url || '',
    linkedin_url: existingProfile?.linkedin_url || '',
    twitter_url: existingProfile?.twitter_url || '',
    website_url: existingProfile?.website_url || '',
  })

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(existingProfile?.avatar_url || null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Step 2: Organization
  const [selectedOrg, setSelectedOrg] = useState<string>(
    existingProfile?.organization_id || ''
  )

  // Step 3: Interests
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    existingProfile?.skills || []
  )
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    existingProfile?.interests || []
  )

  // Step 4: Notifications
  const [notificationData, setNotificationData] = useState<NotificationStepData>({
    email_notifications: true,
    push_notifications: true,
    digest_frequency: 'daily',
  })

  const handleNext = async () => {
    setIsLoading(true)

    try {
      if (currentStep === 1) {
        if (!profileData.full_name.trim()) {
          toast({ title: 'Name required', description: 'Please enter your name', variant: 'destructive' })
          setIsLoading(false)
          return
        }
        const result = await saveProfileStep(profileData)
        if (!result.success) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
          setIsLoading(false)
          return
        }
      } else if (currentStep === 2) {
        if (!selectedOrg) {
          toast({ title: 'Organization required', description: 'Please select your organization', variant: 'destructive' })
          setIsLoading(false)
          return
        }
        const result = await saveOrganizationStep({ organization_id: selectedOrg })
        if (!result.success) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
          setIsLoading(false)
          return
        }
      } else if (currentStep === 3) {
        const result = await saveInterestsStep({
          skills: selectedSkills,
          interests: selectedInterests,
          linkedin_url: profileData.linkedin_url,
          twitter_url: profileData.twitter_url,
          website_url: profileData.website_url,
        })
        if (!result.success) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
          setIsLoading(false)
          return
        }
      } else if (currentStep === 4) {
        const result = await completeOnboarding(notificationData)
        if (!result.success) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
          setIsLoading(false)
          return
        }
        // Onboarding complete - redirect to pending approval
        toast({ title: 'Profile Complete!', description: 'Your account is pending admin approval.' })
        router.push(result.redirectTo || '/pending-approval')
        return
      }

      setCurrentStep(prev => prev + 1)
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' })
      return
    }

    // Read and preview
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string
      setAvatarPreview(base64Data)
      setIsUploadingAvatar(true)

      try {
        const result = await uploadAvatar(base64Data)
        if (result.success && result.data) {
          setProfileData(prev => ({ ...prev, avatar_url: result.data!.publicUrl }))
          toast({ title: 'Photo uploaded' })
        } else {
          toast({ title: 'Upload failed', description: result.error || 'Please try again', variant: 'destructive' })
          setAvatarPreview(existingProfile?.avatar_url || null)
        }
      } catch {
        toast({ title: 'Upload failed', description: 'Please try again', variant: 'destructive' })
        setAvatarPreview(existingProfile?.avatar_url || null)
      } finally {
        setIsUploadingAvatar(false)
      }
    }
    reader.readAsDataURL(file)

    // Reset input
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isComplete = currentStep > step.id
              const isCurrent = currentStep === step.id

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-full transition-colors',
                      isComplete && 'bg-primary/10 text-primary',
                      isCurrent && 'bg-primary text-primary-foreground',
                      !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="shadow-lg">
              {/* Step 1: Profile */}
              {currentStep === 1 && (
                <>
                  <CardHeader>
                    <CardTitle>Welcome to Village Hub!</CardTitle>
                    <CardDescription>
                      Let&apos;s set up your profile so others can find and collaborate with you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Profile Photo */}
                    <div className="flex flex-col items-center gap-2">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="relative group"
                      >
                        <Avatar className="h-20 w-20">
                          {avatarPreview ? (
                            <AvatarImage src={avatarPreview} alt="Profile" />
                          ) : null}
                          <AvatarFallback className="text-xl bg-primary/10 text-primary">
                            {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute inset-0 rounded-full flex items-center justify-center transition-opacity",
                          isUploadingAvatar
                            ? "bg-black/50 opacity-100"
                            : "bg-black/40 opacity-0 group-hover:opacity-100"
                        )}>
                          {isUploadingAvatar ? (
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          ) : (
                            <Camera className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </button>
                      <span className="text-xs text-muted-foreground">Click to add photo</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={profileData.full_name}
                        onChange={e => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g. Community Manager, Volunteer Coordinator"
                        value={profileData.job_title}
                        onChange={e => setProfileData(prev => ({ ...prev, job_title: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Short Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell others a bit about yourself and your work..."
                        value={profileData.bio}
                        onChange={e => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 2: Organization */}
              {currentStep === 2 && (
                <>
                  <CardHeader>
                    <CardTitle>Select Your Organization</CardTitle>
                    <CardDescription>
                      Choose the organization you&apos;re part of. This helps connect you with the right team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
                      {organizations.map(org => (
                        <button
                          key={org.id}
                          onClick={() => setSelectedOrg(org.id)}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-lg border text-left transition-colors',
                            selectedOrg === org.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          )}
                        >
                          <Avatar className="h-10 w-10">
                            {org.logo_url ? (
                              <AvatarImage src={org.logo_url} alt={org.name} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {org.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{org.name}</div>
                            {org.description && (
                              <div className="text-sm text-muted-foreground truncate">
                                {org.description}
                              </div>
                            )}
                          </div>
                          {selectedOrg === org.id && (
                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 3: Interests */}
              {currentStep === 3 && (
                <>
                  <CardHeader>
                    <CardTitle>Your Skills & Interests</CardTitle>
                    <CardDescription>
                      Help us connect you with relevant projects and people.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-80 overflow-y-auto pr-2 space-y-5">
                      <div>
                        <Label className="mb-3 block">What skills do you bring?</Label>
                        <div className="flex flex-wrap gap-2">
                          {skillOptions.map(skill => (
                            <Badge
                              key={skill}
                              variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                              className="cursor-pointer transition-colors"
                              onClick={() => toggleSkill(skill)}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="mb-3 block">What causes interest you?</Label>
                        <div className="flex flex-wrap gap-2">
                          {interestOptions.map(interest => (
                            <Badge
                              key={interest}
                              variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                              className="cursor-pointer transition-colors"
                              onClick={() => toggleInterest(interest)}
                            >
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Social Links */}
                      <div className="space-y-3 pt-2 border-t">
                        <Label>Links <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Input
                              placeholder="LinkedIn URL"
                              value={profileData.linkedin_url}
                              onChange={e => setProfileData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Input
                              placeholder="X (Twitter) URL"
                              value={profileData.twitter_url}
                              onChange={e => setProfileData(prev => ({ ...prev, twitter_url: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Input
                              placeholder="Website URL"
                              value={profileData.website_url}
                              onChange={e => setProfileData(prev => ({ ...prev, website_url: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 4: Notifications */}
              {currentStep === 4 && (
                <>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how you&apos;d like to stay updated.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about new posts, events, and mentions
                        </p>
                      </div>
                      <Switch
                        checked={notificationData.email_notifications}
                        onCheckedChange={checked =>
                          setNotificationData(prev => ({ ...prev, email_notifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Real-time alerts in your browser
                        </p>
                      </div>
                      <Switch
                        checked={notificationData.push_notifications}
                        onCheckedChange={checked =>
                          setNotificationData(prev => ({ ...prev, push_notifications: checked }))
                        }
                      />
                    </div>

                    <div>
                      <Label className="mb-3 block">Email Digest Frequency</Label>
                      <div className="flex gap-2">
                        {(['daily', 'weekly', 'never'] as const).map(freq => (
                          <Button
                            key={freq}
                            variant={notificationData.digest_frequency === freq ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNotificationData(prev => ({ ...prev, digest_frequency: freq }))}
                          >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between p-6 pt-0">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1 || isLoading}
                >
                  Back
                </Button>
                <Button onClick={handleNext} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentStep === 4 ? 'Complete Setup' : 'Continue'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
