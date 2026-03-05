// Loading skeleton components for CinePilot
// Provides professional loading states with animated placeholders

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-20 mt-2" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-64 w-full rounded" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 border-b border-slate-800">
      <Skeleton className="h-10 w-10 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20 rounded" />
      <Skeleton className="h-6 w-16 rounded" />
    </div>
  )
}

export function ShotRowSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-20 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}

export function SceneListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <FormSkeleton />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ChartSkeleton />
        </div>
        <div>
          <SceneListSkeleton />
        </div>
      </div>
    </div>
  )
}
