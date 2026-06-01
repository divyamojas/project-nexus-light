export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse">
      <div className="h-6 w-40 bg-stone-200 dark:bg-slate-700 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 bg-stone-100 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="h-6 w-48 bg-stone-200 dark:bg-slate-700 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-stone-100 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
