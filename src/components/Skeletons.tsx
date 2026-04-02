/** Skeleton pulse for loading states */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface2 rounded-lg ${className}`} />
  )
}

/** KPI row skeleton */
export function KPISkeleton() {
  return (
    <div className="grid grid-cols-5 gap-3.5 mb-6 max-lg:grid-cols-3 max-sm:grid-cols-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl px-4 py-4">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-7 w-28 mb-2" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      ))}
    </div>
  )
}

/** Ranking table skeleton */
export function RankingSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-7 h-7 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-32 mb-1.5" />
              <Skeleton className="h-2 w-full" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Podium skeleton */
export function PodiumSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 items-end">
          {[170, 200, 155].map((h, i) => (
            <div key={i} className="rounded-xl border border-border p-4" style={{ minHeight: h }}>
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
