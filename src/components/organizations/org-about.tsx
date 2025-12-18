"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, Globe } from "lucide-react"

interface OrgAboutProps {
  organization: {
    mission: string | null
    description: string | null
    cause_areas: string[] | null
    contact_email: string | null
    contact_phone: string | null
    founded_date: string | null
    website: string | null
  }
}

export function OrgAbout({ organization }: OrgAboutProps) {
  return (
    <div className="space-y-6">
      {/* Mission */}
      {organization.mission && (
        <Card className="border-border/50 bg-[var(--surface)]/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-muted-foreground leading-relaxed">
              {organization.mission}
            </p>
          </CardContent>
        </Card>
      )}

      {/* About */}
      {organization.description && (
        <Card className="border-border/50 bg-[var(--surface)]/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-muted-foreground leading-relaxed">
              {organization.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact & Details */}
      <Card className="border-border/50 bg-[var(--surface)]/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Contact & Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {organization.contact_email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${organization.contact_email}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                {organization.contact_email}
              </a>
            </div>
          )}

          {organization.contact_phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${organization.contact_phone}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                {organization.contact_phone}
              </a>
            </div>
          )}

          {organization.website && (
            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors"
              >
                {organization.website}
              </a>
            </div>
          )}

          {organization.founded_date && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Founded {new Date(organization.founded_date).getFullYear()}
              </span>
            </div>
          )}

          {organization.cause_areas && organization.cause_areas.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
                Cause Areas
              </p>
              <div className="flex flex-wrap gap-2">
                {organization.cause_areas.map((area) => (
                  <Badge
                    key={area}
                    variant="secondary"
                    className="bg-muted/50 hover:bg-muted"
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
