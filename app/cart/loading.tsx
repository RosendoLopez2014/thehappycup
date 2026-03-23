export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 animate-pulse">
      {/* Page title skeleton */}
      <div className="h-8 w-32 rounded-lg bg-warm-100 mb-6" />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column: item rows */}
        <div className="flex-1 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-warm-50 rounded-2xl border border-warm-200 p-4 flex gap-4">
              {/* Item image */}
              <div className="h-16 w-16 rounded-xl bg-warm-200 shrink-0" />
              {/* Item details */}
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div className="h-4 w-1/2 rounded bg-warm-200" />
                <div className="h-3 w-1/3 rounded bg-warm-100" />
              </div>
              {/* Price */}
              <div className="h-4 w-12 rounded bg-warm-200 self-center" />
            </div>
          ))}

          {/* Delivery form skeleton */}
          <div className="bg-white rounded-2xl border border-warm-200 p-5 flex flex-col gap-4">
            <div className="h-5 w-32 rounded bg-warm-200" />
            <div className="flex gap-2">
              <div className="h-10 flex-1 rounded-xl bg-warm-100" />
              <div className="h-10 flex-1 rounded-xl bg-warm-100" />
            </div>
            <div className="h-10 w-full rounded-xl bg-warm-100" />
          </div>
        </div>

        {/* Right column: order summary */}
        <aside className="lg:w-1/3">
          <div className="bg-white rounded-2xl border border-warm-200 p-5 flex flex-col gap-4">
            <div className="h-5 w-36 rounded bg-warm-200" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-20 rounded bg-warm-100" />
                  <div className="h-3 w-12 rounded bg-warm-100" />
                </div>
              ))}
            </div>
            <div className="h-px bg-warm-100 my-1" />
            <div className="flex justify-between">
              <div className="h-4 w-10 rounded bg-warm-200" />
              <div className="h-4 w-14 rounded bg-warm-200" />
            </div>
            <div className="h-10 w-full rounded-xl bg-warm-200 mt-2" />
          </div>
        </aside>
      </div>
    </div>
  )
}
