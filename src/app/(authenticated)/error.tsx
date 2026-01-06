'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, LogIn } from 'lucide-react'

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AuthenticatedError]', error)
  }, [error])

  // Check if it's an auth-related error
  const isAuthError = error.message?.toLowerCase().includes('auth') ||
                      error.message?.toLowerCase().includes('unauthorized') ||
                      error.message?.toLowerCase().includes('not authenticated')

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {isAuthError ? 'Authentication Error' : 'Something went wrong'}
          </h1>
          <p className="text-muted-foreground">
            {isAuthError
              ? 'Your session may have expired. Please try logging in again.'
              : 'We encountered an error loading this page. Please try again.'}
          </p>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {isAuthError ? (
            <Button variant="default" className="gap-2" asChild>
              <a href="/login">
                <LogIn className="h-4 w-4" />
                Log in again
              </a>
            </Button>
          ) : (
            <Button onClick={reset} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          )}
          <Button variant="outline" className="gap-2" asChild>
            <a href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
