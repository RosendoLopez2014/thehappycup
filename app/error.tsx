'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm w-full">
        <div className="text-5xl select-none">☕</div>
        <h2 className="text-2xl font-semibold text-warm-600">Something went wrong</h2>
        <p className="text-warm-400 text-sm leading-relaxed">
          We encountered an error loading this page. This is likely a temporary issue.
        </p>
        {error.digest && (
          <p className="text-xs text-warm-300 font-mono">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-warm-600 text-white text-sm font-semibold hover:bg-warm-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-500"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
