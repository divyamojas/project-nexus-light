'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider.js'
import { useToast } from './Toast.js'
import { SchemaManager } from './SchemaManager.js'
import { MonitoringDashboard } from './MonitoringDashboard.js'
import {
  getStats,
  getUsers,
  updateUserRole,
  updateUserApproval,
  deleteUser,
  getAdminBooks,
  toggleBookArchive,
  getAdminRequests,
  updateRequestStatus,
  getAdminLoans,
  completeLoan,
} from '../lib/admin.js'
import {
  getLibraries,
  createLibrary,
  addBookToLibrary,
  removeBookFromLibrary,
} from '../lib/library.js'
import { apiFetch } from '../lib/api.js'
import { AddBookModal } from './AddBookModal.js'
import { formatDisplayName, formatDate } from '../lib/utils.js'

const BASE_TABS = ['Overview', 'Approval Queue', 'Users', 'Books', 'Loans', 'Requests', 'Library']

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const { profile } = useAuth()
  const { toast } = useToast()

  const isSuperAdmin = profile?.role === 'super_admin'
  const tabs = isSuperAdmin ? [...BASE_TABS, 'Database', 'Monitoring'] : BASE_TABS

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-stone-200 dark:border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              activeTab === tab
                ? tab === 'Database'
                  ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                  : tab === 'Monitoring'
                    ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400'
                    : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-stone-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview'       && <OverviewTab toast={toast} />}
      {activeTab === 'Approval Queue' && <ApprovalQueueTab toast={toast} />}
      {activeTab === 'Users'          && <UsersTab toast={toast} currentUserId={profile?.id} />}
      {activeTab === 'Books'          && <BooksTab toast={toast} />}
      {activeTab === 'Loans'          && <LoansTab toast={toast} />}
      {activeTab === 'Requests'       && <RequestsTab toast={toast} />}
      {activeTab === 'Library'        && <LibraryTab toast={toast} />}
      {activeTab === 'Database'    && isSuperAdmin && <SchemaManager toast={toast} />}
      {activeTab === 'Monitoring'  && isSuperAdmin && <MonitoringDashboard toast={toast} />}
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value ?? '—'}</p>
        <p className="text-sm text-stone-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function OverviewTab({ toast }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => toast({ message: 'Failed to load stats', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-24" />)}</div>

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Users" value={stats?.total_users} icon="👥" />
      <StatCard label="Total Books" value={stats?.total_books} icon="📚" />
      <StatCard label="Active Requests" value={stats?.total_requests} icon="📋" />
      <StatCard label="Active Loans" value={stats?.total_loans} icon="🔄" />
    </div>
  )
}

function ApprovalQueueTab({ toast }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    getUsers()
      .then(data => setUsers((data || []).filter(u => u.approval_status === 'pending')))
      .catch(() => toast({ message: 'Failed to load users', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleApproval(id, status) {
    setUpdating(p => ({ ...p, [id]: true }))
    try {
      await updateUserApproval(id, status)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast({ message: `User ${status}`, type: 'success' })
    } catch (err) {
      toast({ message: err.message || 'Failed to update', type: 'error' })
    } finally {
      setUpdating(p => ({ ...p, [id]: false }))
    }
  }

  if (loading) return <div className="text-stone-500 dark:text-slate-400 text-sm">Loading…</div>

  if (!users.length) return (
    <div className="card p-8 text-center">
      <p className="text-stone-500 dark:text-slate-400">No pending approvals.</p>
    </div>
  )

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-700">
          <tr>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">User</th>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Joined</th>
            <th className="text-right px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{formatDisplayName(u)}</p>
                  <p className="text-stone-500 dark:text-slate-400 text-xs">{u.username ? `@${u.username}` : (u.email || 'no username')}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-stone-500 dark:text-slate-400">{formatDate(u.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleApproval(u.id, 'approved')}
                    disabled={updating[u.id]}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(u.id, 'rejected')}
                    disabled={updating[u.id]}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ROLES = ['user', 'admin', 'super_admin']

function UsersTab({ toast, currentUserId }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    getUsers()
      .then(data => setUsers(data || []))
      .catch(() => toast({ message: 'Failed to load users', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleRoleChange(id, role) {
    setUpdating(p => ({ ...p, [id + 'role']: true }))
    try {
      await updateUserRole(id, role)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
      toast({ message: 'Role updated', type: 'success' })
    } catch (err) {
      toast({ message: err.message || 'Failed to update role', type: 'error' })
    } finally {
      setUpdating(p => ({ ...p, [id + 'role']: false }))
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setUpdating(p => ({ ...p, [id + 'del']: true }))
    try {
      await deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast({ message: 'User deleted', type: 'success' })
    } catch (err) {
      toast({ message: err.message || 'Failed to delete', type: 'error' })
    } finally {
      setUpdating(p => ({ ...p, [id + 'del']: false }))
    }
  }

  if (loading) return <div className="text-stone-500 dark:text-slate-400 text-sm">Loading…</div>

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-700">
          <tr>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">User</th>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Status</th>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Role</th>
            <th className="text-right px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800 dark:text-slate-200">{formatDisplayName(u)}</p>
                <p className="text-stone-500 dark:text-slate-400 text-xs">@{u.username || 'no username'}</p>
              </td>
              <td className="px-4 py-3">
                <span className={`badge ${u.approval_status === 'approved' ? 'badge-green' : u.approval_status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'badge-gray'}`}>
                  {u.approval_status}
                </span>
              </td>
              <td className="px-4 py-3">
                <select
                  value={u.role || 'user'}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  disabled={u.id === currentUserId || updating[u.id + 'role']}
                  className="input-field py-1 text-xs w-auto min-w-[120px]"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={u.id === currentUserId || updating[u.id + 'del']}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BooksTab({ toast }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    getAdminBooks()
      .then(data => setBooks(data || []))
      .catch(() => toast({ message: 'Failed to load books', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggleArchive(id, archived) {
    setUpdating(p => ({ ...p, [id]: true }))
    try {
      await toggleBookArchive(id, !archived)
      setBooks(prev => prev.map(b => b.id === id ? { ...b, archived: !archived } : b))
      toast({ message: archived ? 'Book unarchived' : 'Book archived', type: 'success' })
    } catch (err) {
      toast({ message: err.message || 'Failed', type: 'error' })
    } finally {
      setUpdating(p => ({ ...p, [id]: false }))
    }
  }

  if (loading) return <div className="text-stone-500 dark:text-slate-400 text-sm">Loading…</div>

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-700">
          <tr>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Book</th>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Status</th>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Archived</th>
            <th className="text-right px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
          {books.map(b => (
            <tr key={b.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800 dark:text-slate-200">{b.catalog?.title || 'Untitled'}</p>
                <p className="text-stone-500 dark:text-slate-400 text-xs">{b.catalog?.author}</p>
              </td>
              <td className="px-4 py-3 text-stone-600 dark:text-slate-400 capitalize">{b.status}</td>
              <td className="px-4 py-3">
                <span className={b.archived ? 'badge-gray' : 'badge-green'}>{b.archived ? 'Yes' : 'No'}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleToggleArchive(b.id, b.archived)}
                  disabled={updating[b.id]}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40"
                >
                  {b.archived ? 'Unarchive' : 'Archive'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LoansTab({ toast }) {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    getAdminLoans()
      .then(data => setLoans(data || []))
      .catch(() => toast({ message: 'Failed to load loans', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleComplete(id) {
    setUpdating(p => ({ ...p, [id]: true }))
    try {
      await completeLoan(id)
      setLoans(prev => prev.map(l => l.id === id ? { ...l, status: 'returned' } : l))
      toast({ message: 'Loan marked returned', type: 'success' })
    } catch (err) {
      toast({ message: err.message || 'Failed', type: 'error' })
    } finally {
      setUpdating(p => ({ ...p, [id]: false }))
    }
  }

  if (loading) return <div className="text-stone-500 dark:text-slate-400 text-sm">Loading…</div>

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-700">
          <tr>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Book</th>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Status</th>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Loaned</th>
            <th className="text-right px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
          {loans.map(l => (
            <tr key={l.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800 dark:text-slate-200">{l.book?.catalog?.title || 'Untitled'}</p>
              </td>
              <td className="px-4 py-3">
                <span className={l.status === 'active' ? 'badge-blue' : 'badge-green'}>{l.status}</span>
              </td>
              <td className="px-4 py-3 text-stone-500 dark:text-slate-400">{formatDate(l.loaned_at)}</td>
              <td className="px-4 py-3 text-right">
                {l.status === 'active' && (
                  <button
                    onClick={() => handleComplete(l.id)}
                    disabled={updating[l.id]}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40"
                  >
                    Mark Returned
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const REQUEST_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled']

function RequestsTab({ toast }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    getAdminRequests()
      .then(data => setRequests(data || []))
      .catch(() => toast({ message: 'Failed to load requests', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(id, status) {
    setUpdating(p => ({ ...p, [id]: true }))
    try {
      await updateRequestStatus(id, status)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast({ message: 'Status updated', type: 'success' })
    } catch (err) {
      toast({ message: err.message || 'Failed', type: 'error' })
    } finally {
      setUpdating(p => ({ ...p, [id]: false }))
    }
  }

  if (loading) return <div className="text-stone-500 dark:text-slate-400 text-sm">Loading…</div>

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-700">
          <tr>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Book</th>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Created</th>
            <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
          {requests.map(r => (
            <tr key={r.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                {r.book?.catalog?.title || 'Book #' + r.book_id?.slice(0, 8)}
              </td>
              <td className="px-4 py-3 text-stone-500 dark:text-slate-400">{formatDate(r.created_at)}</td>
              <td className="px-4 py-3">
                <select
                  value={r.status}
                  onChange={e => handleStatusChange(r.id, e.target.value)}
                  disabled={updating[r.id]}
                  className="input-field py-1 text-xs w-auto"
                >
                  {REQUEST_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LibraryTab({ toast }) {
  const [libraries, setLibraries] = useState([])
  const [selectedLib, setSelectedLib] = useState(null)
  const [libBooks, setLibBooks] = useState([])
  const [libLoans, setLibLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAddBook, setShowAddBook] = useState(false)
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState({})
  const [completing, setCompleting] = useState({})
  const [form, setForm] = useState({ name: '', city: '', location: '', is_self_service: false })

  useEffect(() => {
    loadLibraries()
  }, [])

  useEffect(() => {
    if (selectedLib) {
      loadLibraryDetails()
    }
  }, [selectedLib])

  async function loadLibraries() {
    setLoading(true)
    try {
      const data = await getLibraries()
      setLibraries(data || [])
      if (data && data.length > 0 && !selectedLib) setSelectedLib(data[0].id)
    } catch {
      toast({ message: 'Failed to load libraries', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function loadLibraryDetails() {
    try {
      const [allLoans, booksData] = await Promise.all([
        getAdminLoans(),
        apiFetch('/books?source=library'),
      ])
      setLibBooks((booksData || []).filter(b => b.library_id === selectedLib))
      setLibLoans((allLoans || []).filter(l => l.library_id === selectedLib && l.status === 'active'))
    } catch {
      toast({ message: 'Failed to load library details', type: 'error' })
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name || !form.city || !form.location) return
    setCreating(true)
    try {
      const lib = await createLibrary(form)
      setLibraries(prev => [...prev, lib])
      setSelectedLib(lib.id)
      setShowCreateForm(false)
      setForm({ name: '', city: '', location: '', is_self_service: false })
      toast({ message: 'Library created', type: 'success' })
    } catch (err) {
      toast({ message: err.message || 'Failed to create library', type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  async function handleRemoveBook(bookId) {
    if (!confirm('Remove this book from the library?')) return
    setRemoving(p => ({ ...p, [bookId]: true }))
    try {
      await removeBookFromLibrary(selectedLib, bookId)
      setLibBooks(prev => prev.filter(b => b.id !== bookId))
      toast({ message: 'Book removed', type: 'success' })
    } catch (err) {
      toast({ message: err.message || 'Failed to remove book', type: 'error' })
    } finally {
      setRemoving(p => ({ ...p, [bookId]: false }))
    }
  }

  async function handleCompleteCheckout(loanId) {
    setCompleting(p => ({ ...p, [loanId]: true }))
    try {
      await completeLoan(loanId)
      setLibLoans(prev => prev.filter(l => l.id !== loanId))
      loadLibraryDetails()
      toast({ message: 'Checkout completed', type: 'success' })
    } catch (err) {
      toast({ message: err.message || 'Failed', type: 'error' })
    } finally {
      setCompleting(p => ({ ...p, [loanId]: false }))
    }
  }

  const currentLib = libraries.find(l => l.id === selectedLib)

  if (loading) return <div className="text-stone-500 dark:text-slate-400 text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      {/* Library selector + create button */}
      <div className="flex items-center gap-3 flex-wrap">
        {libraries.map(lib => (
          <button
            key={lib.id}
            onClick={() => setSelectedLib(lib.id)}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${
              selectedLib === lib.id
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-cyan-400'
            }`}
          >
            {lib.name}
          </button>
        ))}
        <button
          onClick={() => setShowCreateForm(v => !v)}
          className="text-sm px-4 py-2 rounded-full border border-dashed border-stone-300 dark:border-slate-600 text-stone-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 transition-colors"
        >
          + New Library
        </button>
      </div>

      {/* Create library form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="card p-4 space-y-3 border-cyan-200 dark:border-cyan-800">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Create Library</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="input-field text-sm py-2"
              placeholder="Library name *"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              className="input-field text-sm py-2"
              placeholder="City *"
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              required
            />
            <input
              className="input-field text-sm py-2 sm:col-span-2"
              placeholder="Location (e.g. 4th Floor, Bay 3) *"
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_self_service}
              onChange={e => setForm(p => ({ ...p, is_self_service: e.target.checked }))}
              className="rounded"
            />
            Self-service (users pick up books themselves without admin confirmation)
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn-primary text-sm py-1.5 px-4">
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary text-sm py-1.5 px-4">
              Cancel
            </button>
          </div>
        </form>
      )}

      {currentLib && (
        <>
          {/* Library info */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/40 text-sm">
            <div className="min-w-0">
              <p className="font-semibold text-cyan-800 dark:text-cyan-200">{currentLib.name}</p>
              <p className="text-cyan-600 dark:text-cyan-400 text-xs mt-0.5">
                📍 {currentLib.location} · {currentLib.city} ·{' '}
                {currentLib.is_self_service ? 'Self-service' : 'Admin-managed'}
              </p>
            </div>
          </div>

          {/* Library books */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Books ({libBooks.length})
              </h3>
              <button onClick={() => setShowAddBook(true)} className="btn-primary text-xs py-1.5 px-3">
                + Add Book
              </button>
            </div>
            {libBooks.length === 0 ? (
              <div className="card p-6 text-center text-stone-400 dark:text-slate-500 text-sm">
                No books in this library yet.
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Book</th>
                      <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Condition</th>
                      <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                    {libBooks.map(b => (
                      <tr key={b.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{b.catalog?.title || 'Untitled'}</p>
                          <p className="text-stone-500 dark:text-slate-400 text-xs">{b.catalog?.author}</p>
                        </td>
                        <td className="px-4 py-3 text-stone-600 dark:text-slate-400 capitalize">{b.condition}</td>
                        <td className="px-4 py-3 capitalize text-stone-600 dark:text-slate-400">{b.status}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveBook(b.id)}
                            disabled={removing[b.id] || b.status !== 'available'}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                            title={b.status !== 'available' ? 'Cannot remove a checked-out book' : ''}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active checkouts */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-3">
              Active Checkouts ({libLoans.length})
            </h3>
            {libLoans.length === 0 ? (
              <div className="card p-6 text-center text-stone-400 dark:text-slate-500 text-sm">
                No active checkouts.
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Book</th>
                      <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Loaned</th>
                      <th className="text-right px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                    {libLoans.map(l => (
                      <tr key={l.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {l.title || 'Book'}
                        </td>
                        <td className="px-4 py-3 text-stone-500 dark:text-slate-400">{formatDate(l.loaned_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleCompleteCheckout(l.id)}
                            disabled={completing[l.id]}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40"
                          >
                            Mark Returned
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!currentLib && libraries.length === 0 && (
        <div className="card p-10 text-center text-stone-400 dark:text-slate-500">
          <p className="text-sm">No libraries yet. Create one above.</p>
        </div>
      )}

      {showAddBook && (
        <AddBookModal
          libraryId={selectedLib}
          onClose={() => setShowAddBook(false)}
          onAdded={() => { setShowAddBook(false); loadLibraryDetails() }}
        />
      )}
    </div>
  )
}

export default AdminDashboard
