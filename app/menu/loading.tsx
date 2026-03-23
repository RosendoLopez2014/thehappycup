export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-48 rounded-lg bg-warm-100 mb-6" />

      {/* Filter tabs skeleton */}
      <div className="flex gap-2 mb-6 overflow-x-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-warm-100 shrink-0" />
        ))}
      </div>

      {/* Card grid skeleton — 3x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-warm-100 overflow-hidden">
            {/* Image placeholder */}
            <div className="h-40 w-full bg-warm-200" />
            {/* Text lines */}
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 w-3/4 rounded bg-warm-200" />
              <div className="h-3 w-full rounded bg-warm-100" />
              <div className="h-3 w-2/3 rounded bg-warm-100" />
              <div className="h-4 w-1/3 rounded bg-warm-200 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
