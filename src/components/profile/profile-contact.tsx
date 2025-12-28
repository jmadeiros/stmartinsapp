'use client'

import { ProfileWithOrganization } from '@/lib/actions/profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Linkedin, Globe, ExternalLink } from 'lucide-react'

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// Instagram icon component  
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

interface ProfileContactProps {
  profile: ProfileWithOrganization
}

export function ProfileContact({ profile }: ProfileContactProps) {
  // Cast to access potential new fields
  const extendedProfile = profile as ProfileWithOrganization & {
    twitter_url?: string | null
    instagram_url?: string | null
    website_url?: string | null
  }

  const hasContactInfo =
    profile.contact_email || 
    profile.phone || 
    profile.contact_phone || 
    profile.linkedin_url ||
    extendedProfile.twitter_url ||
    extendedProfile.instagram_url ||
    extendedProfile.website_url

  if (!hasContactInfo) {
    return null
  }

  const contactItems: Array<{
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    href: string
    isExternal: boolean
  }> = []

  // Email
  if (profile.contact_email) {
    contactItems.push({
      icon: Mail,
      label: 'Email',
      value: profile.contact_email,
      href: `mailto:${profile.contact_email}`,
      isExternal: false,
    })
  }

  // Phone
  const phoneNumber = profile.phone || profile.contact_phone
  if (phoneNumber) {
    contactItems.push({
      icon: Phone,
      label: 'Phone',
      value: phoneNumber,
      href: `tel:${phoneNumber}`,
      isExternal: false,
    })
  }

  // Website
  if (extendedProfile.website_url) {
    contactItems.push({
      icon: Globe,
      label: 'Website',
      value: 'Visit Website',
      href: extendedProfile.website_url,
      isExternal: true,
    })
  }

  // LinkedIn
  if (profile.linkedin_url) {
    contactItems.push({
      icon: Linkedin,
      label: 'LinkedIn',
      value: 'View Profile',
      href: profile.linkedin_url,
      isExternal: true,
    })
  }

  // X (Twitter)
  if (extendedProfile.twitter_url) {
    contactItems.push({
      icon: XIcon,
      label: 'X (Twitter)',
      value: 'View Profile',
      href: extendedProfile.twitter_url,
      isExternal: true,
    })
  }

  // Instagram
  if (extendedProfile.instagram_url) {
    contactItems.push({
      icon: InstagramIcon,
      label: 'Instagram',
      value: 'View Profile',
      href: extendedProfile.instagram_url,
      isExternal: true,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contactItems.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">{item.label}</p>
                {item.isExternal ? (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    asChild
                  >
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      {item.value}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                ) : (
                  <a
                    href={item.href}
                    className="text-sm hover:underline break-words"
                  >
                    {item.value}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
