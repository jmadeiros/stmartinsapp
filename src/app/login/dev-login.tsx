'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Code } from 'lucide-react'

export function DevLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'>('admin')
  const router = useRouter()
  const supabase = createClient()

  const handleDevLogin = async () => {
    setIsLoading(true)
    try {
      // First, create/ensure the user exists via API
      const response = await fetch('/api/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        alert(`Dev login failed: ${errorData.error || 'Unknown error'}`)
        return
      }

      const data = await response.json()
      console.log('Dev user created/exists:', data)

      // Now sign in with the client using the credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        alert(`Failed to sign in: ${signInError.message}`)
        return
      }

      console.log('Sign in successful, redirecting...')

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Dev login error:', error)
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Code className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900">
              Development Mode
            </h3>
            <p className="text-xs text-yellow-700 mt-1">
              Skip OAuth and create a test user to preview the app
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <label className="text-xs font-medium text-yellow-900">
                Test account:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                disabled={isLoading}
                className="w-full sm:w-auto rounded-md border border-yellow-300 bg-white px-3 py-2 text-sm text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="admin">Admin (admin@stmartins.dev)</option>
                <option value="st_martins_staff">St Martins Staff (staff@stmartins.dev)</option>
                <option value="partner_staff">Partner Staff (partner@stmartins.dev)</option>
                <option value="volunteer">Volunteer (volunteer@stmartins.dev)</option>
              </select>
            </div>
            <Button
              onClick={handleDevLogin}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              {isLoading ? 'Creating test user...' : 'Dev Login (Test Mode)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
