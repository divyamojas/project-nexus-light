'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import RouteGate from '../../../components/RouteGate.js'
import { useAuth } from '../../../components/AuthProvider.js'
import { useToast } from '../../../components/Toast.js'
import { apiFetch } from '../../../lib/api.js'
import { statusColor, conditionLabel, formatDate } from '../../../lib/utils.js'
import PageLoader from '../../../components/PageLoader.js'

export default function BookDetailPage() {
  return (
    <RouteGate requireAuth requireApproved>
      <BookDetailContent />
    </RouteGate>
  )
}

function BookDetailContent() {
  const { id } = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const { toast } = useToast()

  const [book, setBook] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)

  // Review form
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchBook()
    fetchReviews()
  }, [id])

  async function fetchBook() {
    setLoading(true)
    try {
      const data = await apiFetch(`/books/${id}`)
      setBook(data)
    } catch (err) {
      toast({ message: 'Book not found', type: 'error' })
      router.replace('/books')
    } finally {
      setLoading(false)
    }
  }

  async function fetchReviews() {
    try {
      const data = await apiFetch(`/reviews/book/${id}`)
      setReviews(data || [])
    } catch {}
  }

  async function handleAction(type) {
    if (actioning) return
    setActioning(true)
    try {
      if (type === 'request') {
        await apiFetch('/requests', {
          method: 'POST',
          body: JSON.stringify({ book_id: id }),
        })
        toast({ message: 'Borrow request sent!', type: 'success' })
        fetchBook()
      } else if (type === 'save') {
        await apiFetch('/saved', {
          method: 'POST',
          body: JSON.stringify({ book_id: id, catalog_id: book.catalog?.id }),
        })
        toast({ message: 'Book saved', type: 'success' })
        fetchBook()
      } else if (type === 'unsave') {
        await apiFetch(`/saved/${id}`, { method: 'DELETE' })
        toast({ message: 'Book unsaved', type: 'success' })
        fetchBook()
      } else if (type === 'archive') {
        await apiFetch(`/books/${id}/archive`, {
          method: 'PATCH',
          body: JSON.stringify({ archived: true }),
        })
        toast({ message: 'Book archived', type: 'success' })
        fetchBook()
      } else if (type === 'unarchive') {
        await apiFetch(`/books/${id}/archive`, {
          method: 'PATCH',
          body: JSON.stringify({ archived: false }),
        })
        toast({ message: 'Book unarchived', type: 'success' })
        fetchBook()
      } else if (type === 'delete') {
        if (!confirm('Delete this book? This cannot be undone.')) return
        await apiFetch(`/books/${id}`, { method: 'DELETE' })
        toast({ message: 'Book deleted', type: 'success' })
        router.replace('/books')
      }
    } catch (err) {
      toast({ message: err.message || 'Action failed', type: 'error' })
    } finally {
      setActioning(false)
    }
  }

  async function submitReview() {
    setSubmittingReview(true)
    try {
      await apiFetch('/reviews/book', {
        method: 'POST',
        body: JSON.stringify({ book_id: id, rating, comment: comment.trim() || undefined }),
      })
      toast({ message: 'Review submitted!', type: 'success' })
      setComment('')
      setRating(5)
      fetchReviews()
    } catch (err) {
      toast({ message: err.message || 'Failed to submit review', type: 'error' })
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <PageLoader />
  if (!book) return null

  const catalog = book.catalog || {}
  const isOwner = book.user_id === profile?.id
  const isAvailable = book.status === 'available' && !book.archived

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link href="/books" className="inline-flex items-center gap-1 text-sm text-stone-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Browse
      </Link>

      {/* Main card */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0 w-40 h-56 rounded-xl overflow-hidden bg-stone-100 dark:bg-slate-700 mx-auto sm:mx-0">
            {catalog.cover_url ? (
              <img src={catalog.cover_url} alt={catalog.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-14 h-14 text-stone-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {catalog.title || 'Untitled'}
              </h1>
              <p className="text-stone-500 dark:text-slate-400 mt-1">
                by {catalog.author || 'Unknown author'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={statusColor(book.status)}>{book.archived ? 'Archived' : book.status}</span>
              <span className="badge-gray">{conditionLabel(book.condition)}</span>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {catalog.isbn && (
                <>
                  <dt className="text-stone-400 dark:text-slate-500">ISBN</dt>
                  <dd className="text-slate-700 dark:text-slate-300">{catalog.isbn}</dd>
                </>
              )}
              <dt className="text-stone-400 dark:text-slate-500">Added</dt>
              <dd className="text-slate-700 dark:text-slate-300">{formatDate(book.created_at)}</dd>
            </dl>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-2">
              {!isOwner && isAvailable && !book.request_status && (
                <button onClick={() => handleAction('request')} disabled={actioning} className="btn-primary">
                  Request Borrow
                </button>
              )}

              {!isOwner && (
                <button
                  onClick={() => handleAction(book.is_saved ? 'unsave' : 'save')}
                  disabled={actioning}
                  className="btn-secondary flex items-center gap-1.5"
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
              )}

              {isOwner && (
                <>
                  <button
                    onClick={() => handleAction(book.archived ? 'unarchive' : 'archive')}
                    disabled={actioning}
                    className="btn-secondary"
                  >
                    {book.archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    disabled={actioning}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {book.request_status && !isOwner && (
              <p className="text-sm text-stone-500 dark:text-slate-400">
                Your request status: <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{book.request_status}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Reviews</h2>

        {/* Submit review */}
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Write a review</h3>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`text-xl transition-colors ${n <= rating ? 'text-amber-400' : 'text-stone-300 dark:text-slate-600'} hover:text-amber-400`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="input-field resize-none mb-3"
            rows={2}
            placeholder="Share your thoughts about this book…"
          />
          <button
            onClick={submitReview}
            disabled={submittingReview}
            className="btn-primary text-sm"
          >
            {submittingReview ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-slate-500">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="card p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                  {(review.reviewer_name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{review.reviewer_name || 'Reader'}</span>
                    <span className="text-amber-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className="text-xs text-stone-400 dark:text-slate-500 ml-auto">{formatDate(review.created_at)}</span>
                  </div>
                  {review.comment && <p className="text-sm text-stone-600 dark:text-slate-400">{review.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
