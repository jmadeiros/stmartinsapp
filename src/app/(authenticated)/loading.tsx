import { Skeleton } from '@/components/ui/skeleton'

export default function AuthenticatedLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="hidden h-4 w-24 sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 lg:p-6">
        <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[280px_1fr_320px]">
          {/* Left sidebar skeleton */}
          <div className="hidden space-y-4 lg:block">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>

          {/* Main feed skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>

          {/* Right sidebar skeleton */}
          <div className="hidden space-y-4 lg:block">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
