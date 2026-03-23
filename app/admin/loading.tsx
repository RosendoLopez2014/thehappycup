export default function Loading() {
  return (
    <div className="p-6 animate-pulse">
      {/* Page title */}
      <div className="h-7 w-28 rounded-lg bg-warm-200 mb-6" />

      {/* Stats cards — 3 boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-warm-200 p-5 flex flex-col gap-3">
            <div className="h-3 w-24 rounded bg-warm-100" />
            <div className="h-7 w-16 rounded bg-warm-200" />
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-warm-100 shrink-0" />
        ))}
      </div>

      {/* Order card list */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-warm-200 p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 rounded bg-warm-200" />
                <div className="h-3 w-24 rounded bg-warm-100" />
              </div>
              <div className="h-6 w-20 rounded-full bg-warm-100" />
            </div>
            <div className="flex gap-2">
              <div className="h-3 w-16 rounded bg-warm-100" />
              <div className="h-3 w-16 rounded bg-warm-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
