function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className || ""}`} />
  )
}

export default function PaymentsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border p-6">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="border-b bg-gray-50 px-4 py-3">
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
