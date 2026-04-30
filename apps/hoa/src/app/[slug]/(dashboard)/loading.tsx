function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className || ""}`}
    />
  )
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="h-[260px] w-full" />
    </div>
  )
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Three panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelSkeleton rows={2} />
        <PanelSkeleton rows={2} />
      </div>
    </div>
  )
}
