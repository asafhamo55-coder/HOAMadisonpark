function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className || ""}`}
    />
  )
}

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar skeleton */}
        <div className="space-y-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          {/* Forms section */}
          <div>
            <Skeleton className="mb-3 h-4 w-32" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </div>

          {/* Table skeleton */}
          <div className="rounded-lg border">
            <div className="border-b bg-gray-50 px-4 py-3">
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b px-4 py-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
