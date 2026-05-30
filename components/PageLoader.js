export function PageLoader() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-stone-200 dark:border-slate-700 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-stone-500 dark:text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  )
}

export default PageLoader
