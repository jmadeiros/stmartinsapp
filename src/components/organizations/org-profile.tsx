"use client"

import { OrgHeader } from "./org-header"
import { OrgAbout } from "./org-about"
import { OrgTeam } from "./org-team"
import type { OrganizationWithMembers } from "@/lib/actions/organizations"

interface OrgProfileProps {
  organization: OrganizationWithMembers
  canEdit: boolean
}

export function OrgProfile({ organization, canEdit }: OrgProfileProps) {
  return (
    <div className="space-y-8">
      {/* Header with logo, name, room location, badges */}
      <OrgHeader organization={organization} canEdit={canEdit} />

      {/* Two-column layout for About and Team */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* About section - 1 column */}
        <div className="lg:col-span-1">
          <OrgAbout organization={organization} />
        </div>

        {/* Team section - 2 columns */}
        <div className="lg:col-span-2">
          <OrgTeam members={organization.members} />
        </div>
      </div>
    </div>
  )
}
