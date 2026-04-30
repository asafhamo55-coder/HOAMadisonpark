function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className || ""}`} />
  )
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
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
