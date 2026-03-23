import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm w-full">
        <div className="text-6xl select-none">☕</div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-warm-600">404</h1>
          <h2 className="text-lg font-semibold text-warm-500">Page Not Found</h2>
          <p className="text-warm-400 text-sm leading-relaxed">
            Looks like this page wandered off. Let&apos;s get you back to the good stuff.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-warm-600 text-white text-sm font-semibold hover:bg-warm-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-500"
        >
          Back to Menu
        </Link>

        <p className="text-xs text-warm-300">The Happy Cup</p>
      </div>
    </div>
  )
}
