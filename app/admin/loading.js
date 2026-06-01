export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-7 w-36 bg-stone-200 dark:bg-slate-700 rounded" />
      <div className="h-4 w-56 bg-stone-100 dark:bg-slate-800 rounded" />

      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-stone-200 dark:border-slate-700 pb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`h-8 rounded-md bg-stone-100 dark:bg-slate-800 ${i === 0 ? 'w-24 bg-stone-200 dark:bg-slate-700' : 'w-20'}`} />
        ))}
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-stone-100 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        <div className="h-10 bg-stone-100 dark:bg-slate-800 rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-stone-50 dark:bg-slate-900 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
