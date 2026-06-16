export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-surface animate-pulse rounded-sm ${className}`} />
  )
}

export function TournamentHeaderSkeleton() {
  return (
    <div className="px-6 pt-5 pb-5 border-b border-border bg-gradient-to-b from-surface/25 to-transparent">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-9 w-56 mb-3" />
      <div className="flex gap-3 mb-3">
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  )
}

export function TabsSkeleton({ count = 4 }) {
  return (
    <div className="hidden sm:flex border-b border-border px-4 gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-24 rounded-none" />
      ))}
    </div>
  )
}

export function CardSkeleton({ lines = 2 }) {
  return (
    <div className="border border-border-mid rounded-lg p-5 flex flex-col gap-3">
      <Skeleton className="h-5 w-2/3" />
      {lines >= 2 && <Skeleton className="h-3.5 w-1/2" />}
      {lines >= 3 && <Skeleton className="h-3.5 w-1/3" />}
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-3">
      <Skeleton className="h-4 w-4 shrink-0" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-20 shrink-0" />
    </div>
  )
}
