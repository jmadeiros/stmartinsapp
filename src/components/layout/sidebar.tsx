'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  MessageSquare,
  Calendar,
  Briefcase,
  FileText,
  Newspaper,
  Utensils,
  Building2,
  Settings,
  Shield,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Community Board', href: '/board', icon: MessageSquare },
  { name: 'Events Calendar', href: '/events', icon: Calendar },
  { name: 'Jobs & Volunteering', href: '/jobs', icon: Briefcase },
  { name: 'Community Chat', href: '/chat', icon: MessageSquare },
  { name: 'Lunch Menu', href: '/menu', icon: Utensils },
  { name: 'Meeting Notes', href: '/notes', icon: FileText },
  { name: 'Media Coverage', href: '/media', icon: Newspaper },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  user: any
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile sidebar backdrop - TODO: Add mobile menu toggle */}
      <div className="lg:hidden">
        {/* Mobile menu will go here */}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">The Village Hub</span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors',
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive
                                ? 'text-white'
                                : 'text-gray-400 group-hover:text-primary'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>

              {/* Bottom navigation */}
              <li className="mt-auto">
                <ul role="list" className="-mx-2 space-y-1">
                  {bottomNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors',
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive
                                ? 'text-white'
                                : 'text-gray-400 group-hover:text-primary'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}

                  {/* Admin Panel - Only show for admins */}
                  {user?.role === 'admin' && (
                    <li>
                      <Link
                        href="/admin"
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors',
                          pathname === '/admin'
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                        )}
                      >
                        <Shield
                          className={cn(
                            'h-5 w-5 shrink-0',
                            pathname === '/admin'
                              ? 'text-white'
                              : 'text-gray-400 group-hover:text-primary'
                          )}
                        />
                        Admin Panel
                      </Link>
                    </li>
                  )}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
