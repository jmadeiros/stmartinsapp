import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      {/* Post composer skeleton */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Feed filters skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-18 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Post cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
