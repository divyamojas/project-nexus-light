import BookCard from './BookCard.js'

function BookCardSkeleton() {
  return (
    <div className="card p-4 flex flex-col gap-3 animate-pulse">
      <div className="w-full aspect-[3/4] rounded-lg bg-stone-200 dark:bg-slate-700" />
      <div className="space-y-2">
        <div className="h-4 bg-stone-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-stone-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
      <div className="h-8 bg-stone-200 dark:bg-slate-700 rounded mt-auto" />
    </div>
  )
}

export function BookGrid({ books = [], onAction, currentUserId, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!books.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-stone-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-stone-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">No books found</p>
        <p className="text-stone-400 dark:text-slate-500 text-sm mt-1">Try adjusting your filters or add some books.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {books.map(book => (
        <BookCard
          key={book.id}
          book={book}
          onAction={onAction}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}

export default BookGrid
