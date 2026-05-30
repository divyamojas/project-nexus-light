'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider.js'
import { useToast } from './Toast.js'
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
import { formatDisplayName, formatDate } from '../lib/utils.js'

const TABS = ['Overview', 'Approval Queue', 'Users', 'Books', 'Loans', 'Requests']

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const { profile } = useAuth()
  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-stone-200 dark:border-slate-700">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-stone-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && <OverviewTab toast={toast} />}
      {activeTab === 'Approval Queue' && <ApprovalQueueTab toast={toast} />}
      {activeTab === 'Users' && <UsersTab toast={toast} currentUserId={profile?.id} />}
      {activeTab === 'Books' && <BooksTab toast={toast} />}
      {activeTab === 'Loans' && <LoansTab toast={toast} />}
      {activeTab === 'Requests' && <RequestsTab toast={toast} />}
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

export default AdminDashboard
