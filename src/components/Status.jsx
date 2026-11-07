export function Loading({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      {label}
    </div>
  );
}

export function FeedSkeleton({ count = 3, grid = false }) {
  return (
    <div role="status" aria-label="Loading" className={grid ? 'grid gap-6 md:grid-cols-2 md:items-start' : 'space-y-4'}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-3 w-28 rounded-full bg-gray-200" />
              <div className="h-2.5 w-16 rounded-full bg-gray-100" />
            </div>
          </div>
          <div className="aspect-[4/3] bg-gray-100" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-full rounded-full bg-gray-200" />
            <div className="h-3 w-2/3 rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorMsg({ error, onRetry }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">😕</div>
      <p className="text-sm text-gray-700">{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white active:scale-95"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ icon = '✨', children }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 text-3xl">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500">{children}</p>
    </div>
  );
}