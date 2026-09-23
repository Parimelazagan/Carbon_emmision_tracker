export function ChartSkeleton({ className = 'h-64' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-100 ${className}`}
      aria-hidden="true"
    />
  )
}

export function ChartEmptyState({ message = 'No data for this period' }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
      {message}
    </div>
  )
}
