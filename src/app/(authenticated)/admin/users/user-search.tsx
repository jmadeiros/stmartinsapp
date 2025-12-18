'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useState, useTransition } from "react"

type Organization = {
  id: string
  name: string
  slug: string
}

export function UserSearch({ organizations }: { organizations: Organization[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [role, setRole] = useState(searchParams.get('role') || '')
  const [orgId, setOrgId] = useState(searchParams.get('orgId') || '')

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (role) params.set('role', role)
      if (orgId) params.set('orgId', orgId)

      router.push(`/admin/users?${params.toString()}`)
    })
  }

  const handleClear = () => {
    setSearch('')
    setRole('')
    setOrgId('')
    startTransition(() => {
      router.push('/admin/users')
    })
  }

  return (
    <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="st_martins_staff">St Martins Staff</option>
            <option value="partner_staff">Partner Staff</option>
            <option value="volunteer">Volunteer</option>
          </select>
        </div>

        {/* Organization Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization
          </label>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSearch}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={handleClear}
          disabled={isPending}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
