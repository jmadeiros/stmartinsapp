"use client"

import { useState, useMemo } from "react"
import { SocialHeader } from "@/components/social/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PeopleLeftSidebar } from "./people-left-sidebar"
import { PersonInfoPanel } from "./person-info-panel"
import { PeopleTab } from "./people-tab"
import { OrganizationDetailView } from "./organization-detail-view"
import type { PersonProfile, OrganizationProfile } from "@/app/(authenticated)/people/actions"
import { Users, Building2 } from "lucide-react"

interface PeoplePageProps {
  people: PersonProfile[]
  organizations: OrganizationProfile[]
  currentUserId?: string
}

export function PeoplePage({ people, organizations, currentUserId }: PeoplePageProps) {
  const [selectedPerson, setSelectedPerson] = useState<PersonProfile | null>(null)
  const [selectedOrg, setSelectedOrg] = useState<OrganizationProfile | null>(null)
  const [activeTab, setActiveTab] = useState<"people" | "organizations">("people")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOrgId, setFilterOrgId] = useState<string | null>(null)

  const handleTabChange = (value: string) => {
    setActiveTab(value as "people" | "organizations")
    if (value === "organizations") {
      setSelectedOrg(null)
    }
  }

  const handleSelectOrg = (org: OrganizationProfile | null) => {
    if (activeTab === "organizations") {
      setSelectedOrg(org)
    } else {
      setFilterOrgId(org?.id || null)
    }
  }

  // Filter people based on search and org filter
  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        person.full_name.toLowerCase().includes(searchLower) ||
        person.job_title?.toLowerCase().includes(searchLower) ||
        person.skills?.some(s => s.toLowerCase().includes(searchLower))
      const matchesOrg = !filterOrgId || person.organization?.id === filterOrgId
      return matchesSearch && matchesOrg
    })
  }, [people, searchQuery, filterOrgId])

  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
          {/* Left Sidebar */}
          <PeopleLeftSidebar 
            people={people}
            organizations={organizations}
            activeTab={activeTab}
            selectedOrgId={activeTab === "organizations" ? selectedOrg?.id || null : filterOrgId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectOrg={handleSelectOrg}
            onSelectPerson={setSelectedPerson}
          />

          {/* Main Content */}
          <main className="min-w-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              {/* Mobile Header */}
              <div className="lg:hidden mb-4">
                <h1 className="text-2xl font-bold text-foreground mb-1">People Directory</h1>
                <p className="text-muted-foreground text-sm">
                  Connect with people across The Village
                </p>
              </div>

              <div className="flex items-center justify-end mb-6">
                <TabsList className="grid w-[280px] grid-cols-2">
                  <TabsTrigger value="people" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    People
                  </TabsTrigger>
                  <TabsTrigger value="organizations" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Organizations
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="people" className="mt-0">
                <PeopleTab 
                  people={filteredPeople}
                  allPeople={people}
                  organizations={organizations}
                  onSelectPerson={setSelectedPerson}
                  selectedPersonId={selectedPerson?.user_id}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterOrgId={filterOrgId}
                  onFilterOrgChange={(orgId) => setFilterOrgId(orgId)}
                  onClearFilters={() => {
                    setSearchQuery("")
                    setFilterOrgId(null)
                  }}
                />
              </TabsContent>

              <TabsContent value="organizations" className="mt-0">
                <OrganizationDetailView 
                  organization={selectedOrg}
                  people={people}
                  onSelectPerson={setSelectedPerson}
                />
              </TabsContent>
            </Tabs>
          </main>

          {/* Right Sidebar - Person Info Panel */}
          <PersonInfoPanel 
            person={selectedPerson}
            allPeople={people}
            onClose={() => setSelectedPerson(null)}
            onSelectPerson={setSelectedPerson}
          />
        </div>
      </div>
    </div>
  )
}
