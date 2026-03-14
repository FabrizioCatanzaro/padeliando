function SkeletonBox({ className = '' }) {
  return (
    <div className={`animate-pulse bg-border-mid rounded ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border-mid rounded-lg p-5">
      <SkeletonBox className="h-5 w-2/3 mb-3" />
      <SkeletonBox className="h-3 w-1/2 mb-4" />
      <SkeletonBox className="h-3 w-1/4" />
    </div>
  )
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3']
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox key={i} className={`h-3 ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}