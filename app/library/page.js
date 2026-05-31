'use client'

import { useState, useEffect, useContext } from 'react'
import { RouteGate } from '../../components/RouteGate.js'
import { BookGrid } from '../../components/BookGrid.js'
import { BookCard } from '../../components/BookCard.js'
import { AuthContext } from '../../components/AuthProvider.js'
import { useToast } from '../../components/Toast.js'
import { apiFetch } from '../../lib/api.js'
import { pickupLibraryBook, reserveLibraryBook, returnLibraryBook } from '../../lib/library.js'

function LibraryContent() {
  const { profile } = useContext(AuthContext)
  const { toast } = useToast()

  const [books, setBooks] = useState([])
  const [libraries, setLibraries] = useState([])
  const [selectedLibrary, setSelectedLibrary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLibraryData()
  }, [])

  async function loadLibraryData() {
    setLoading(true)
    try {
      const [booksData, libsData] = await Promise.all([
        apiFetch('/books?source=library'),
        apiFetch('/library'),
      ])
      setBooks(booksData)
      setLibraries(libsData)
      if (libsData.length > 0) setSelectedLibrary(libsData[0].id)
    } catch (err) {
      toast({ message: 'Failed to load library', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAction({ type, book }) {
    try {
      if (type === 'pickup') {
        await pickupLibraryBook(book.id)
        toast({ message: 'Picked up! Enjoy your read.', type: 'success' })
        loadLibraryData()
      } else if (type === 'reserve') {
        await reserveLibraryBook(book.id)
        toast({ message: 'Reserved! An admin will confirm your checkout.', type: 'success' })
        loadLibraryData()
      } else if (type === 'save' || type === 'unsave') {
        await apiFetch(type === 'save' ? '/saved' : `/saved/${book.id}`, {
          method: type === 'save' ? 'POST' : 'DELETE',
          body: type === 'save' ? JSON.stringify({ book_id: book.id, catalog_id: book.catalog.id }) : undefined,
        })
        loadLibraryData()
      }
    } catch (err) {
      toast({ message: err.message || 'Action failed', type: 'error' })
    }
  }

  const currentLib = libraries.find(l => l.id === selectedLibrary)
  const visibleBooks = selectedLibrary
    ? books.filter(b => b.library_id === selectedLibrary)
    : books

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Office Library</h1>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
          Company books available for borrowing
        </p>
      </div>

      {libraries.length === 0 ? (
        <div className="text-center py-20 text-stone-400 dark:text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
          <p className="text-sm">No libraries set up yet.</p>
          <p className="text-xs mt-1">Ask an admin to create one.</p>
        </div>
      ) : (
        <>
          {/* Library selector */}
          {libraries.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {libraries.map(lib => (
                <button
                  key={lib.id}
                  onClick={() => setSelectedLibrary(lib.id)}
                  className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                    selectedLibrary === lib.id
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-cyan-400'
                  }`}
                >
                  {lib.name}
                </button>
              ))}
            </div>
          )}

          {/* Library info banner */}
          {currentLib && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/40">
              <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <div className="min-w-0">
                <p className="font-semibold text-cyan-800 dark:text-cyan-200 text-sm">{currentLib.name}</p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">
                  📍 {currentLib.location} · {currentLib.city}
                </p>
                <p className="text-xs text-cyan-500 dark:text-cyan-500 mt-0.5">
                  {currentLib.is_self_service
                    ? 'Self-service — pick up books directly from the shelf'
                    : 'Admin-managed — reserve online, admin will check you out'}
                </p>
              </div>
            </div>
          )}

          {/* Books grid */}
          {visibleBooks.length === 0 ? (
            <div className="text-center py-16 text-stone-400 dark:text-slate-500">
              <p className="text-sm">No books in this library yet.</p>
            </div>
          ) : (
            <BookGrid>
              {visibleBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  currentUserId={profile?.id}
                  onAction={handleAction}
                />
              ))}
            </BookGrid>
          )}
        </>
      )}
    </div>
  )
}

export default function LibraryPage() {
  return (
    <RouteGate requireAuth requireApproved>
      <LibraryContent />
    </RouteGate>
  )
}
