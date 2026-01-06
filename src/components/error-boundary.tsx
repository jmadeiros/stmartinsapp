'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * A reusable error boundary component for wrapping risky client components.
 * Use this to prevent errors in one component from crashing the entire page.
 *
 * @example
 * <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *   <RiskyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground">
              This section encountered an error.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * A simpler inline error fallback for less critical components.
 * Shows a minimal error message without the full error boundary UI.
 */
export function InlineErrorFallback({ message = 'Failed to load' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <span>{message}</span>
    </div>
  )
}
