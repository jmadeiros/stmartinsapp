'use client'

import { useState } from 'react'
import { ProfileWithOrganization, updateProfile } from '@/lib/actions/profile'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, X } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface ProfileEditDialogProps {
  profile: ProfileWithOrganization
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileEditDialog({ profile, open, onOpenChange }: ProfileEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    job_title: profile.job_title || '',
    bio: profile.bio || '',
    phone: profile.phone || '',
    contact_email: profile.contact_email || '',
    linkedin_url: profile.linkedin_url || '',
    skills: profile.skills || [],
    interests: profile.interests || [],
  })

  // Temporary input states for adding tags
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await updateProfile(profile.user_id, {
        full_name: formData.full_name,
        job_title: formData.job_title || null,
        bio: formData.bio || null,
        phone: formData.phone || null,
        contact_email: formData.contact_email || null,
        linkedin_url: formData.linkedin_url || null,
        skills: formData.skills.length > 0 ? formData.skills : null,
        interests: formData.interests.length > 0 ? formData.interests : null,
      })

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'destructive',
        })
        console.error(error)
        return
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      })
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    })
  }

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interestInput.trim()],
      })
      setInterestInput('')
    }
  }

  const removeInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((i) => i !== interest),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Changes will be visible to other users in your
            organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="full_name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="job_title">
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell others about yourself..."
                rows={4}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Social Links</h3>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Twitter and Instagram fields are coming soon - pending database migration.
            </p>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Skills</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  placeholder="Add a skill (e.g., Project Management)"
                />
                <Button type="button" onClick={addSkill} variant="outline">
                  Add
                </Button>
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Interests</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addInterest()
                    }
                  }}
                  placeholder="Add an interest (e.g., Youth Development)"
                />
                <Button type="button" onClick={addInterest} variant="outline">
                  Add
                </Button>
              </div>
              {formData.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="gap-1">
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
