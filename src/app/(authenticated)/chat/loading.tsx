import { Skeleton } from '@/components/ui/skeleton'

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation list skeleton */}
      <div className="w-80 border-r p-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="border-b p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
              {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-64'} rounded-lg`} />
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="border-t p-4">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
