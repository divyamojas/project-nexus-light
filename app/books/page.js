'use client'

import { useState, useEffect } from 'react'
import RouteGate from '../../components/RouteGate.js'
import BookGrid from '../../components/BookGrid.js'
import AddBookModal from '../../components/AddBookModal.js'
import { useAuth } from '../../components/AuthProvider.js'
import { useToast } from '../../components/Toast.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { apiFetch } from '../../lib/api.js'
import { cacheBooks, getCachedBooks } from '../../lib/storage.js'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'available', label: 'Available' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'lent', label: 'Lent' },
]

export default function BooksPage() {
  return (
    <RouteGate requireAuth requireApproved>
      <BooksContent />
    </RouteGate>
  )
}

function BooksContent() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    async function init() {
      const cached = await getCachedBooks()
      if (cached.length) {
        setBooks(cached)
        setLoading(false)
        fetchBooks(true)
        return
      }
      fetchBooks()
    }
    init()
  }, [])

  async function fetchBooks(silent = false) {
    if (!silent) setLoading(true)
    try {
      const data = await apiFetch('/books')
      setBooks(data || [])
      await cacheBooks(data || [])
    } catch (err) {
      if (!silent) toast({ message: 'Failed to load books', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAction({ type, book }) {
    try {
      if (type === 'archive' || type === 'unarchive') {
        await apiFetch(`/books/${book.id}/archive`, {
          method: 'PATCH',
          body: JSON.stringify({ archived: type === 'archive' }),
        })
        toast({ message: type === 'archive' ? 'Book archived' : 'Book unarchived', type: 'success' })
        fetchBooks(true)
      } else if (type === 'delete') {
        if (!confirm('Delete this book?')) return
        await apiFetch(`/books/${book.id}`, { method: 'DELETE' })
        toast({ message: 'Book deleted', type: 'success' })
        fetchBooks(true)
      } else if (type === 'request') {
        await apiFetch('/requests', {
          method: 'POST',
          body: JSON.stringify({ book_id: book.id }),
        })
        toast({ message: 'Borrow request sent!', type: 'success' })
        fetchBooks(true)
      } else if (type === 'save') {
        await apiFetch('/saved', {
          method: 'POST',
          body: JSON.stringify({ book_id: book.id, catalog_id: book.catalog?.id }),
        })
        toast({ message: 'Book saved', type: 'success' })
        fetchBooks(true)
      } else if (type === 'unsave') {
        await apiFetch(`/saved/${book.id}`, { method: 'DELETE' })
        toast({ message: 'Book unsaved', type: 'success' })
        fetchBooks(true)
      }
    } catch (err) {
      toast({ message: err.message || 'Action failed', type: 'error' })
    }
  }

  const filtered = books.filter(book => {
    const q = debouncedSearch.toLowerCase().trim()
    if (q) {
      const title = book.catalog?.title?.toLowerCase() || ''
      const author = book.catalog?.author?.toLowerCase() || ''
      if (!title.includes(q) && !author.includes(q)) return false
    }
    if (statusFilter && book.status !== statusFilter) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Browse Books</h1>
          <p className="text-stone-500 dark:text-slate-400 text-sm mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'book' : 'books'} in the community
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Book
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Search by title or author…"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-field w-auto"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <BookGrid
        books={filtered}
        onAction={handleAction}
        currentUserId={profile?.id}
        loading={loading}
      />

      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => fetchBooks(true)}
        />
      )}
    </div>
  )
}
