export default function BooksLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-stone-200 dark:bg-slate-700 rounded" />
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-stone-100 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-32 bg-stone-100 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-stone-100 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
