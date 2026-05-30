'use client'

import { statusColor, conditionLabel, truncate } from '../lib/utils.js'

export function BookCard({ book, onAction, currentUserId }) {
  if (!book) return null

  const isOwner = book.user_id === currentUserId
  const catalog = book.catalog || {}
  const isAvailable = book.status === 'available' && !book.archived
  const isSaved = book.is_saved

  function handleAction(type) {
    if (onAction) onAction({ type, book })
  }

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Cover */}
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 dark:bg-slate-700 flex-shrink-0">
        {catalog.cover_url ? (
          <img
            src={catalog.cover_url}
            alt={catalog.title || 'Book cover'}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-stone-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-2 left-2">
          <span className={statusColor(book.status)}>
            {book.archived ? 'Archived' : book.status}
          </span>
        </div>
        {/* Save button overlay */}
        {!isOwner && (
          <button
            onClick={() => handleAction(isSaved ? 'unsave' : 'save')}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center shadow hover:scale-105 transition-transform"
            title={isSaved ? 'Unsave' : 'Save'}
          >
            <svg
              className={`w-4 h-4 ${isSaved ? 'text-emerald-600 fill-emerald-600' : 'text-stone-400 dark:text-slate-500'}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill={isSaved ? 'currentColor' : 'none'}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight line-clamp-2">
          {catalog.title || 'Untitled'}
        </h3>
        <p className="text-stone-500 dark:text-slate-400 text-xs truncate">
          {catalog.author || 'Unknown author'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="badge-gray text-xs">{conditionLabel(book.condition)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 mt-auto">
        {isOwner ? (
          <>
            <button
              onClick={() => handleAction(book.archived ? 'unarchive' : 'archive')}
              className="btn-secondary text-xs py-1.5 px-3 w-full"
            >
              {book.archived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              onClick={() => handleAction('delete')}
              className="text-xs py-1.5 px-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
            >
              Delete
            </button>
          </>
        ) : (
          isAvailable && !book.request_status && (
            <button
              onClick={() => handleAction('request')}
              className="btn-primary text-xs py-1.5 px-3 w-full"
            >
              Request Borrow
            </button>
          )
        )}
        {book.request_status && !isOwner && (
          <span className="text-center text-xs text-stone-500 dark:text-slate-400 py-1">
            Request: {book.request_status}
          </span>
        )}
      </div>
    </div>
  )
}

export default BookCard
