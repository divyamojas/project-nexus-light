export default function ProfileLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-7 w-32 bg-stone-200 dark:bg-slate-700 rounded mb-2" />
      <div className="h-4 w-64 bg-stone-100 dark:bg-slate-800 rounded mb-8" />

      <div className="max-w-lg space-y-5">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-stone-200 dark:bg-slate-700" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-stone-100 dark:bg-slate-800 rounded" />
            <div className="h-3 w-24 bg-stone-100 dark:bg-slate-800 rounded" />
          </div>
        </div>

        {/* Form fields */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-24 bg-stone-200 dark:bg-slate-700 rounded" />
            <div className="h-10 w-full bg-stone-100 dark:bg-slate-800 rounded-lg" />
          </div>
        ))}

        <div className="h-10 w-32 bg-stone-200 dark:bg-slate-700 rounded-lg mt-2" />
      </div>
    </div>
  )
}
