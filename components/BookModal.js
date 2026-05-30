'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api.js'
import { statusColor, conditionLabel, formatDate } from '../lib/utils.js'

export function BookModal({ book, onClose, onAction }) {
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  useEffect(() => {
    if (!book) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [book, onClose])

  useEffect(() => {
    if (!book) return
    async function fetchReviews() {
      try {
        const data = await apiFetch(`/reviews/book/${book.id}`)
        setReviews(data || [])
      } catch {
        setReviews([])
      } finally {
        setLoadingReviews(false)
      }
    }
    fetchReviews()
  }, [book])

  if (!book) return null

  const catalog = book.catalog || {}
  const isAvailable = book.status === 'available' && !book.archived

  function handleAction(type) {
    if (onAction) onAction({ type, book })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {catalog.title || 'Untitled'}
            </h2>
            <p className="text-stone-500 dark:text-slate-400 mt-0.5">
              by {catalog.author || 'Unknown author'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col sm:flex-row gap-6">
          {/* Cover */}
          <div className="flex-shrink-0 w-36 h-48 rounded-xl overflow-hidden bg-stone-100 dark:bg-slate-700 self-start mx-auto sm:mx-0">
            {catalog.cover_url ? (
              <img src={catalog.cover_url} alt={catalog.title} className="w-full h-full object-cover" loading="eager" decoding="async" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12 text-stone-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <span className={statusColor(book.status)}>
                {book.archived ? 'Archived' : book.status}
              </span>
              <span className="badge-gray">{conditionLabel(book.condition)}</span>
            </div>

            {catalog.isbn && (
              <div>
                <span className="text-xs text-stone-400 dark:text-slate-500 uppercase tracking-wide">ISBN</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{catalog.isbn}</p>
              </div>
            )}

            <div>
              <span className="text-xs text-stone-400 dark:text-slate-500 uppercase tracking-wide">Added</span>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{formatDate(book.created_at)}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-auto">
              {isAvailable && !book.request_status && (
                <button onClick={() => handleAction('request')} className="btn-primary text-sm">
                  Request Borrow
                </button>
              )}
              <button
                onClick={() => handleAction(book.is_saved ? 'unsave' : 'save')}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <svg
                  className={`w-4 h-4 ${book.is_saved ? 'text-emerald-600 fill-emerald-600' : ''}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  fill={book.is_saved ? 'currentColor' : 'none'}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {book.is_saved ? 'Saved' : 'Save'}
              </button>
            </div>

            {book.request_status && (
              <p className="text-sm text-stone-500 dark:text-slate-400">
                Your request: <span className="font-medium text-slate-700 dark:text-slate-300">{book.request_status}</span>
              </p>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="border-t border-stone-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Reviews</h3>
          {loadingReviews ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-stone-200 dark:bg-slate-700 rounded w-1/4" />
                    <div className="h-3 bg-stone-200 dark:bg-slate-700 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-stone-400 dark:text-slate-500">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                    {(review.reviewer_name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {review.reviewer_name || 'User'}
                      </span>
                      <span className="text-xs text-stone-400 dark:text-slate-500">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-stone-600 dark:text-slate-400">{review.comment}</p>
                    )}
                    <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">{formatDate(review.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookModal
