export default function BookDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex gap-6">
        <div className="w-32 h-48 bg-stone-200 dark:bg-slate-700 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-6 w-3/4 bg-stone-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-1/2 bg-stone-100 dark:bg-slate-800 rounded" />
          <div className="h-4 w-1/3 bg-stone-100 dark:bg-slate-800 rounded" />
          <div className="h-10 w-full bg-stone-100 dark:bg-slate-800 rounded-lg mt-4" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <div className="h-4 w-full bg-stone-100 dark:bg-slate-800 rounded" />
        <div className="h-4 w-5/6 bg-stone-100 dark:bg-slate-800 rounded" />
        <div className="h-4 w-4/6 bg-stone-100 dark:bg-slate-800 rounded" />
      </div>
    </div>
  )
}
