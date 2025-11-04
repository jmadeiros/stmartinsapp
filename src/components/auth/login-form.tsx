'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const supabase = createClient()

  const handleOAuthLogin = async (provider: 'azure' | 'google') => {
    try {
      setIsLoading(provider)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('OAuth error:', error.message)
        alert(`Login failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-xl p-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            The Village Hub
          </h1>
          <p className="text-sm text-gray-600">
            Internal Communications Platform
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => handleOAuthLogin('azure')}
            disabled={isLoading !== null}
            className="w-full h-11"
            variant="outline"
          >
            {isLoading === 'azure' ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                  <path d="M0 0h11v11H0z" fill="#f25022" />
                  <path d="M12 0h11v11H12z" fill="#00a4ef" />
                  <path d="M0 12h11v11H0z" fill="#7fba00" />
                  <path d="M12 12h11v11H12z" fill="#ffb900" />
                </svg>
                <span>Continue with Microsoft</span>
              </div>
            )}
          </Button>

          <Button
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading !== null}
            className="w-full h-11"
            variant="outline"
          >
            {isLoading === 'google' ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </div>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-gray-500 mt-6">
          By signing in, you agree to our terms of service and privacy policy.
          <br />
          Only authorized users can access this platform.
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-gray-600 mt-6">
        Need help? Contact{' '}
        <a href="mailto:admin@villagehub.org" className="text-primary hover:underline">
          admin@villagehub.org
        </a>
      </p>
    </div>
  )
}
