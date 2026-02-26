import { cn } from '@/lib/utils'

function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('animate-pulse rounded-md bg-muted/60', className)} style={style} />
}

// Metric card skeleton (matches RevOps dashboard cards)
export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Bone className="h-3 w-20" />
        <Bone className="h-7 w-7 rounded-lg" />
      </div>
      <Bone className="h-7 w-16" />
      <Bone className="h-2.5 w-24" />
    </div>
  )
}

// Chart skeleton
export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 pb-2 flex items-center justify-between">
        <Bone className="h-4 w-32" />
        <Bone className="h-5 w-20 rounded-full" />
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-end gap-2 justify-around" style={{ height }}>
          {[40, 65, 80, 45, 70, 55, 90, 35, 60].map((h, i) => (
            <Bone key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Table skeleton (matches accounts/transitions tables)
export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 border-b bg-muted/20 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className={cn('h-2.5', i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-20', 'flex-shrink-0')} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 border-b last:border-0 px-4 py-3">
          {Array.from({ length: cols }).map((_, col) => (
            <Bone key={col} className={cn('h-3', col === 0 ? 'w-36' : col === 1 ? 'w-16 rounded-full' : 'w-16', 'flex-shrink-0')} />
          ))}
        </div>
      ))}
    </div>
  )
}

// List item skeleton (matches transition list cards)
export function ListItemSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <Bone className="h-2.5 w-2.5 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Bone className="h-3.5 w-40" />
          <Bone className="h-4 w-16 rounded-full" />
        </div>
        <Bone className="h-2.5 w-56" />
      </div>
      <Bone className="h-3 w-16" />
      <div className="flex gap-2">
        <Bone className="h-5 w-14 rounded-full" />
        <Bone className="h-5 w-18 rounded-full" />
      </div>
    </div>
  )
}

// Team member card skeleton
export function TeamCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Bone className="h-[2px] w-3/4" />
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <Bone className="h-11 w-11 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-44" />
            <div className="flex gap-1.5">
              <Bone className="h-4 w-12 rounded-full" />
              <Bone className="h-4 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-3 grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="text-center space-y-1.5">
              <Bone className="h-5 w-10 mx-auto" />
              <Bone className="h-2 w-14 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Dashboard page skeleton (full page)
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <Bone className="h-7 w-48" />
        <Bone className="h-4 w-72" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3"><ChartSkeleton /></div>
        <div className="lg:col-span-2"><ChartSkeleton /></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <Bone className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-1">
                <Bone className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Bone className="h-3 w-28" />
                  <Bone className="h-2.5 w-40" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Page header skeleton
export function PageHeaderSkeleton({ hasAction = true }: { hasAction?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <Bone className="h-7 w-36" />
        <Bone className="h-4 w-56" />
      </div>
      {hasAction && <Bone className="h-9 w-32 rounded-lg" />}
    </div>
  )
}

// Empty state component
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-[12px] text-muted-foreground max-w-[300px] leading-relaxed">{description}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  )
}
