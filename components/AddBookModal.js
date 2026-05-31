'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api.js'
import { addBookToLibrary } from '../lib/library.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useToast } from './Toast.js'

const CONDITIONS = ['new', 'good', 'fair', 'worn']
const CONDITION_LABELS = { new: 'New', good: 'Good', fair: 'Fair', worn: 'Worn' }

export function AddBookModal({ onClose, onAdded, libraryId = null }) {
  const isLibraryMode = !!libraryId
  const { toast } = useToast()
  const [step, setStep] = useState('search') // search | catalog | manual
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [condition, setCondition] = useState('good')
  const [submitting, setSubmitting] = useState(false)

  // Manual form state
  const [manual, setManual] = useState({
    title: '',
    author: '',
    isbn: '',
    cover_url: '',
    condition: 'good',
  })

  const debouncedQuery = useDebounce(query, 350)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    if (!debouncedQuery.trim() || step !== 'search') {
      setResults([])
      return
    }
    async function search() {
      setSearching(true)
      try {
        const data = await apiFetch(`/catalog/search?q=${encodeURIComponent(debouncedQuery)}`)
        setResults(data || [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }
    search()
  }, [debouncedQuery, step])

  function selectCatalogEntry(entry) {
    setSelected(entry)
    setStep('catalog')
  }

  async function submitCatalogBook() {
    if (!selected || !condition) return
    setSubmitting(true)
    try {
      const book = isLibraryMode
        ? await addBookToLibrary(libraryId, { catalog_id: selected.id, condition })
        : await apiFetch('/books', {
            method: 'POST',
            body: JSON.stringify({ catalog_id: selected.id, condition }),
          })
      toast({ message: 'Book added successfully!', type: 'success' })
      if (onAdded) onAdded(book)
      onClose()
    } catch (err) {
      toast({ message: err.message || 'Failed to add book', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  async function submitManualBook() {
    if (!manual.title.trim() || !manual.author.trim()) {
      toast({ message: 'Title and author are required', type: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const catalogEntry = await apiFetch('/catalog', {
        method: 'POST',
        body: JSON.stringify({
          title: manual.title.trim(),
          author: manual.author.trim(),
          ...(manual.isbn.trim() ? { isbn: manual.isbn.trim() } : {}),
          ...(manual.cover_url.trim() ? { cover_url: manual.cover_url.trim() } : {}),
        }),
      })
      const book = isLibraryMode
        ? await addBookToLibrary(libraryId, { catalog_id: catalogEntry.id, condition: manual.condition })
        : await apiFetch('/books', {
            method: 'POST',
            body: JSON.stringify({ catalog_id: catalogEntry.id, condition: manual.condition }),
          })
      toast({ message: 'Book added successfully!', type: 'success' })
      if (onAdded) onAdded(book)
      onClose()
    } catch (err) {
      toast({ message: err.message || 'Failed to add book', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-2xl shadow-xl max-w-lg w-full z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isLibraryMode ? 'Add Book to Library' : 'Add a Book'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Step: Search */}
          {step === 'search' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  Search by title
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="input-field"
                  placeholder="e.g. The Great Gatsby"
                  autoFocus
                />
              </div>

              {/* Results */}
              {searching && (
                <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-slate-400">
                  <div className="w-4 h-4 border-2 border-stone-300 border-t-emerald-500 rounded-full animate-spin" />
                  Searching…
                </div>
              )}

              {!searching && results.length > 0 && (
                <div className="border border-stone-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-slate-700">
                  {results.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => selectCatalogEntry(entry)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      {entry.cover_url ? (
                        <img src={entry.cover_url} alt={entry.title} className="w-10 h-14 object-cover rounded flex-shrink-0" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-10 h-14 bg-stone-100 dark:bg-slate-700 rounded flex-shrink-0 flex items-center justify-center">
                          <svg className="w-5 h-5 text-stone-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{entry.title}</p>
                        <p className="text-stone-500 dark:text-slate-400 text-xs truncate">{entry.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!searching && query.trim() && results.length === 0 && (
                <p className="text-sm text-stone-500 dark:text-slate-400">No matches found.</p>
              )}

              <button
                onClick={() => setStep('manual')}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline text-left"
              >
                Not found? Add manually
              </button>
            </div>
          )}

          {/* Step: Catalog match — select condition */}
          {step === 'catalog' && selected && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                {selected.cover_url ? (
                  <img src={selected.cover_url} alt={selected.title} className="w-16 h-22 object-cover rounded-lg flex-shrink-0" loading="eager" decoding="async" />
                ) : (
                  <div className="w-16 h-22 bg-stone-100 dark:bg-slate-700 rounded-lg flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selected.title}</p>
                  <p className="text-stone-500 dark:text-slate-400 text-sm">{selected.author}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  Condition
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CONDITIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        condition === c
                          ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-stone-200 dark:border-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {CONDITION_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep('search')} className="btn-secondary flex-1">
                  Back
                </button>
                <button
                  onClick={submitCatalogBook}
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? 'Adding…' : 'Add Book'}
                </button>
              </div>
            </div>
          )}

          {/* Step: Manual entry */}
          {step === 'manual' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manual.title}
                    onChange={e => setManual(p => ({ ...p, title: e.target.value }))}
                    className="input-field"
                    placeholder="Book title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manual.author}
                    onChange={e => setManual(p => ({ ...p, author: e.target.value }))}
                    className="input-field"
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">ISBN</label>
                  <input
                    type="text"
                    value={manual.isbn}
                    onChange={e => setManual(p => ({ ...p, isbn: e.target.value }))}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Cover URL</label>
                  <input
                    type="url"
                    value={manual.cover_url}
                    onChange={e => setManual(p => ({ ...p, cover_url: e.target.value }))}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Condition</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CONDITIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => setManual(p => ({ ...p, condition: c }))}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          manual.condition === c
                            ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-stone-200 dark:border-slate-600 hover:border-emerald-400'
                        }`}
                      >
                        {CONDITION_LABELS[c]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep('search')} className="btn-secondary flex-1">
                  Back
                </button>
                <button
                  onClick={submitManualBook}
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? 'Adding…' : 'Add Book'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddBookModal
