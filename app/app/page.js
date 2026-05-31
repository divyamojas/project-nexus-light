'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import RouteGate from '../../components/RouteGate.js'
import BookGrid from '../../components/BookGrid.js'
import { useAuth } from '../../components/AuthProvider.js'
import { useToast } from '../../components/Toast.js'
import { apiFetch } from '../../lib/api.js'
import { formatDisplayName, formatDate } from '../../lib/utils.js'

export default function DashboardPage() {
  return (
    <RouteGate requireAuth requireApproved>
      <DashboardContent />
    </RouteGate>
  )
}

function DashboardContent() {
  const { profile, role } = useAuth()
  const { toast } = useToast()

  const [myBooks, setMyBooks] = useState([])
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loans, setLoans] = useState([])
  const [browseBooks, setBrowseBooks] = useState([])
  const [loadingBooks, setLoadingBooks] = useState(true)

  const [feedback, setFeedback] = useState('')
  const [sendingFeedback, setSendingFeedback] = useState(false)

  useEffect(() => {
    if (!profile) return
    fetchAll()
  }, [profile])

  async function fetchAll() {
    await Promise.all([
      fetchAllBooks(),
      fetchIncoming(),
      fetchOutgoing(),
      fetchTransfers(),
      fetchLoans(),
    ])
  }

  async function fetchAllBooks() {
    try {
      const data = await apiFetch('/books')
      const all = data || []
      setMyBooks(all.filter(b => b.user_id === profile?.id))
      setBrowseBooks(all.filter(b => b.status === 'available' && !b.archived && b.user_id !== profile?.id).slice(0, 8))
    } catch {}
    finally { setLoadingBooks(false) }
  }

  async function fetchIncoming() {
    try {
      const data = await apiFetch('/requests/incoming')
      setIncoming(data || [])
    } catch {}
  }

  async function fetchOutgoing() {
    try {
      const data = await apiFetch('/requests/outgoing')
      setOutgoing(data || [])
    } catch {}
  }

  async function fetchTransfers() {
    try {
      const data = await apiFetch('/transfers')
      setTransfers(data || [])
    } catch {}
  }

  async function fetchLoans() {
    try {
      const data = await apiFetch('/loans')
      setLoans(data || [])
    } catch {}
  }

  async function handleRequestAction(type, id) {
    try {
      await apiFetch(`/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: type }),
      })
      toast({ message: `Request ${type}`, type: 'success' })
      fetchIncoming()
      fetchOutgoing()
      fetchAllBooks()
    } catch (err) {
      toast({ message: err.message || 'Action failed', type: 'error' })
    }
  }

  async function handleTransferAction(type, id) {
    try {
      if (type === 'complete') {
        await apiFetch(`/transfers/${id}/complete`, { method: 'POST' })
        toast({ message: 'Transfer completed! Loan created.', type: 'success' })
      } else {
        await apiFetch(`/transfers/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: type }),
        })
        toast({ message: 'Transfer updated', type: 'success' })
      }
      fetchTransfers()
      fetchLoans()
      fetchAllBooks()
    } catch (err) {
      toast({ message: err.message || 'Action failed', type: 'error' })
    }
  }

  async function handleBookAction({ type, book }) {
    try {
      if (type === 'archive' || type === 'unarchive') {
        await apiFetch(`/books/${book.id}/archive`, {
          method: 'PATCH',
          body: JSON.stringify({ archived: type === 'archive' }),
        })
        toast({ message: type === 'archive' ? 'Book archived' : 'Book unarchived', type: 'success' })
        fetchAllBooks()
      } else if (type === 'delete') {
        if (!confirm('Delete this book?')) return
        await apiFetch(`/books/${book.id}`, { method: 'DELETE' })
        toast({ message: 'Book deleted', type: 'success' })
        fetchAllBooks()
      } else if (type === 'request') {
        await apiFetch('/requests', {
          method: 'POST',
          body: JSON.stringify({ book_id: book.id }),
        })
        toast({ message: 'Borrow request sent!', type: 'success' })
        fetchAllBooks()
      } else if (type === 'save') {
        await apiFetch('/saved', {
          method: 'POST',
          body: JSON.stringify({ book_id: book.id, catalog_id: book.catalog?.id }),
        })
        toast({ message: 'Book saved', type: 'success' })
        fetchAllBooks()
      } else if (type === 'unsave') {
        await apiFetch(`/saved/${book.id}`, { method: 'DELETE' })
        toast({ message: 'Book unsaved', type: 'success' })
        fetchAllBooks()
      }
    } catch (err) {
      toast({ message: err.message || 'Action failed', type: 'error' })
    }
  }

  async function sendFeedback() {
    if (!feedback.trim()) {
      toast({ message: 'Please enter a message', type: 'error' })
      return
    }
    setSendingFeedback(true)
    try {
      await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({ message: feedback.trim() }),
      })
      toast({ message: 'Feedback sent! Thank you.', type: 'success' })
      setFeedback('')
    } catch (err) {
      toast({ message: err.message || 'Failed to send feedback', type: 'error' })
    } finally {
      setSendingFeedback(false)
    }
  }

  const libraryBorrows = loans.filter(l => l.borrower_id === profile?.id && l.status === 'active' && l.book_source === 'library')
  const p2pLoans = loans.filter(l => l.book_source !== 'library')
  const lentLoans = p2pLoans.filter(l => l.lender_id === profile?.id && l.status === 'active')
  const borrowedLoans = p2pLoans.filter(l => l.borrower_id === profile?.id && l.status === 'active')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Good to see you, {profile?.first_name || profile?.username || 'reader'} 👋
        </h1>
        <p className="text-stone-500 dark:text-slate-400 mt-0.5 text-sm">
          Here's what's happening in your book library
        </p>
      </div>

      {/* My Books */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">My Books</h2>
          <span className="text-sm text-stone-500 dark:text-slate-400">{myBooks.length} books</span>
        </div>
        {myBooks.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-stone-500 dark:text-slate-400 text-sm">You haven't added any books yet.</p>
            <Link href="/books" className="mt-3 inline-block btn-primary text-sm">
              Browse &amp; Add Books
            </Link>
          </div>
        ) : (
          <BookGrid
            books={myBooks.slice(0, 8)}
            onAction={handleBookAction}
            currentUserId={profile?.id}
          />
        )}
      </section>

      {/* Incoming Requests */}
      {incoming.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Incoming Requests
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
              {incoming.length}
            </span>
          </h2>
          <div className="space-y-3">
            {incoming.map(req => (
              <div key={req.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    {req.book?.catalog?.title || 'Untitled book'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Requested by <span className="font-medium">{req.requester_name || req.requested_by?.slice(0, 8)}</span>
                    {req.message && <span> — "{req.message}"</span>}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRequestAction('accepted', req.id)}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequestAction('rejected', req.id)}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Outgoing Requests */}
      {outgoing.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Outgoing Requests
          </h2>
          <div className="space-y-3">
            {outgoing.map(req => (
              <div key={req.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    {req.book?.catalog?.title || 'Untitled book'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Status: <span className="font-medium capitalize">{req.status}</span>
                    {' · '}{formatDate(req.created_at)}
                  </p>
                </div>
                {req.status === 'pending' && (
                  <button
                    onClick={() => handleRequestAction('cancelled', req.id)}
                    className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Transfers */}
      {transfers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Active Transfers
          </h2>
          <div className="space-y-3">
            {transfers.map(tr => (
              <div key={tr.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    {tr.book?.catalog?.title || 'Book transfer'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Status: <span className="font-medium capitalize">{tr.status}</span>
                    {tr.scheduled_at && <span> · Scheduled {formatDate(tr.scheduled_at)}</span>}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {tr.status === 'pending' && (
                    <button
                      onClick={() => handleTransferAction('confirmed', tr.id)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Confirm
                    </button>
                  )}
                  {tr.status === 'confirmed' && (
                    <button
                      onClick={() => handleTransferAction('complete', tr.id)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Library Borrows */}
      {libraryBorrows.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Library Borrows
          </h2>
          <div className="space-y-3">
            {libraryBorrows.map(loan => (
              <LibraryLoanCard key={loan.id} loan={loan} toast={toast} onRefresh={fetchLoans} />
            ))}
          </div>
        </section>
      )}

      {/* Active Loans */}
      {(lentLoans.length > 0 || borrowedLoans.length > 0) && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Active Loans
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lentLoans.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-stone-500 dark:text-slate-400 mb-2">Books I'm lending</h3>
                <div className="space-y-2">
                  {lentLoans.map(loan => (
                    <LoanCard key={loan.id} loan={loan} type="lent" toast={toast} onRefresh={fetchLoans} />
                  ))}
                </div>
              </div>
            )}
            {borrowedLoans.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-stone-500 dark:text-slate-400 mb-2">Books I'm borrowing</h3>
                <div className="space-y-2">
                  {borrowedLoans.map(loan => (
                    <LoanCard key={loan.id} loan={loan} type="borrowed" toast={toast} onRefresh={fetchLoans} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Browse */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Discover Books</h2>
          <Link href="/books" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
            View all →
          </Link>
        </div>
        <BookGrid
          books={browseBooks}
          onAction={handleBookAction}
          currentUserId={profile?.id}
          loading={loadingBooks}
        />
      </section>

      {/* Feedback */}
      <section className="pb-4">
        <div className="card p-6 max-w-lg">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Share your feedback</h2>
          <p className="text-sm text-stone-500 dark:text-slate-400 mb-4">
            Have a suggestion or found a bug? We'd love to hear from you.
          </p>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            className="input-field resize-none mb-3"
            rows={3}
            placeholder="Your feedback…"
          />
          <button
            onClick={sendFeedback}
            disabled={sendingFeedback}
            className="btn-primary text-sm"
          >
            {sendingFeedback ? 'Sending…' : 'Send Feedback'}
          </button>
        </div>
      </section>
    </div>
  )
}

function LibraryLoanCard({ loan, toast, onRefresh }) {
  const [loading, setLoading] = useState(false)

  async function returnToLibrary() {
    setLoading(true)
    try {
      await apiFetch('/returns', {
        method: 'POST',
        body: JSON.stringify({ book_id: loan.book_id }),
      })
      toast({ message: 'Returned to library!', type: 'success' })
      onRefresh()
    } catch (err) {
      toast({ message: err.message || 'Failed to return', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-3 flex items-center justify-between gap-3 border-l-2 border-cyan-400 dark:border-cyan-600">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {loan.title || 'Untitled'}
        </p>
        <p className="text-xs text-stone-500 dark:text-slate-400">
          📍 {loan.library_location || loan.library_name || 'Office Library'} · Borrowed {formatDate(loan.loaned_at)}
        </p>
      </div>
      <button
        onClick={returnToLibrary}
        disabled={loading}
        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex-shrink-0 disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? 'Returning…' : 'Return to Library'}
      </button>
    </div>
  )
}

function LoanCard({ loan, type, toast, onRefresh }) {
  const [loading, setLoading] = useState(false)

  async function requestReturn() {
    setLoading(true)
    try {
      await apiFetch('/returns', {
        method: 'POST',
        body: JSON.stringify({ book_id: loan.book_id }),
      })
      toast({ message: 'Return request sent', type: 'success' })
      onRefresh()
    } catch (err) {
      toast({ message: err.message || 'Failed to request return', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {loan.book?.catalog?.title || 'Untitled'}
        </p>
        <p className="text-xs text-stone-500 dark:text-slate-400">
          {type === 'lent' ? `Borrowed by ${loan.borrower_name || 'user'}` : `Lent by ${loan.lender_name || 'user'}`}
        </p>
      </div>
      {type === 'borrowed' && !loan.return_request_id && (
        <button
          onClick={requestReturn}
          disabled={loading}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex-shrink-0 disabled:opacity-50"
        >
          Request Return
        </button>
      )}
      {loan.return_request_id && (
        <span className="text-xs text-stone-400 dark:text-slate-500 flex-shrink-0">Return requested</span>
      )}
    </div>
  )
}
