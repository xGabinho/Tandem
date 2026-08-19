interface SkeletonLoaderProps {
  /** Width class (e.g., 'w-full', 'w-32') */
  width?: string
  /** Height class (e.g., 'h-4', 'h-10') */
  height?: string
  /** Whether to render as a circle (avatar placeholder) */
  circle?: boolean
  /** Number of lines to render (for text blocks) */
  lines?: number
  /** Custom className */
  className?: string
}

export default function SkeletonLoader({
  width = 'w-full',
  height = 'h-4',
  circle = false,
  lines = 1,
  className = '',
}: SkeletonLoaderProps) {
  if (circle) {
    return (
      <div
        className={`skeleton rounded-full ${width} ${height} ${className}`}
        aria-hidden="true"
      />
    )
  }

  if (lines > 1) {
    return (
      <div className={`flex flex-col gap-2.5 ${className}`} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${height} ${
              i === lines - 1 ? 'w-3/4' : width
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`skeleton ${width} ${height} ${className}`}
      aria-hidden="true"
    />
  )
}

/**
 * Pre-built skeleton layouts for common patterns
 */
export function GoalCardSkeleton() {
  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="skeleton w-full h-40" style={{ borderRadius: 0 }} />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <SkeletonLoader width="w-16" height="h-5" />
          <SkeletonLoader width="w-12" height="h-5" />
        </div>
        <SkeletonLoader width="w-3/4" height="h-5" />
        <SkeletonLoader width="w-full" height="h-2" />
        <div className="flex justify-between">
          <SkeletonLoader width="w-20" height="h-4" />
          <SkeletonLoader width="w-16" height="h-4" />
        </div>
      </div>
    </div>
  )
}

export function DashboardStatSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <SkeletonLoader width="w-10" height="h-10" circle />
      <SkeletonLoader width="w-24" height="h-3" />
      <SkeletonLoader width="w-32" height="h-7" />
    </div>
  )
}
