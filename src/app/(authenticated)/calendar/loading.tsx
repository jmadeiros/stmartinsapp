import { Skeleton } from '@/components/ui/skeleton'

export default function CalendarLoading() {
  return (
    <div className="p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Calendar grid skeleton */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center border-r last:border-r-0">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        {[1, 2, 3, 4, 5].map((week) => (
          <div key={week} className="grid grid-cols-7 border-b last:border-b-0">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className="min-h-[100px] p-2 border-r last:border-r-0">
                <Skeleton className="h-5 w-5 mb-2" />
                {week === 2 && day === 3 && <Skeleton className="h-6 w-full rounded mb-1" />}
                {week === 3 && day === 5 && <Skeleton className="h-6 w-full rounded mb-1" />}
                {week === 4 && day === 2 && <Skeleton className="h-6 w-full rounded mb-1" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
