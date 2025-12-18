'use client'

import { ProfileWithOrganization } from '@/lib/actions/profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Linkedin, Twitter, Instagram, ExternalLink } from 'lucide-react'

interface ProfileContactProps {
  profile: ProfileWithOrganization
}

export function ProfileContact({ profile }: ProfileContactProps) {
  const hasContactInfo =
    profile.contact_email || profile.phone || profile.contact_phone || profile.linkedin_url

  if (!hasContactInfo) {
    return null
  }

  const contactItems = []

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

  // Note: Twitter and Instagram would be added here when available in the database
  // Example for future use:
  // if (profile.twitter_url) {
  //   contactItems.push({
  //     icon: Twitter,
  //     label: 'Twitter',
  //     value: 'View Profile',
  //     href: profile.twitter_url,
  //     isExternal: true,
  //   })
  // }

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

        {/* Future social links placeholder */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Additional social links (Twitter, Instagram) will be available after database migration.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
