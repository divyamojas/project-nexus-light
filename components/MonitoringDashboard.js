'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getRequestLogs, getRequestLogStats, deleteRequestLogs } from '../lib/admin.js'

// ── constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 100
const PATH_DEBOUNCE_MS = 400

const METHOD_COLORS = {
  GET:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  POST:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PUT:    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PATCH:  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

// ── utils ─────────────────────────────────────────────────────────────────────

function statusColor(code) {
  if (!code) return 'text-stone-400'
  if (code < 300) return 'text-emerald-600 dark:text-emerald-400'
  if (code < 400) return 'text-blue-500 dark:text-blue-400'
  if (code < 500) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function durationColor(ms) {
  if (!ms) return 'text-stone-400'
  if (ms < 100) return 'text-emerald-600 dark:text-emerald-400'
  if (ms < 500) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function statusRange(val) {
  if (val === '2xx') return { status_gte: 200, status_lte: 299 }
  if (val === '3xx') return { status_gte: 300, status_lte: 399 }
  if (val === '4xx') return { status_gte: 400, status_lte: 499 }
  if (val === '5xx') return { status_gte: 500, status_lte: 599 }
  return {}
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  const border = { blue: 'border-l-blue-500', green: 'border-l-emerald-500', red: 'border-l-red-500', amber: 'border-l-amber-500' }
  return (
    <div className={`card p-4 border-l-4 ${border[accent] ?? 'border-l-stone-300'}`}>
      <p className="text-xs text-stone-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function SortTh({ field, label, sortBy, sortDir, onSort, className = '' }) {
  const active = sortBy === field
  return (
    <th className={`text-left px-3 py-2.5 font-medium text-stone-500 dark:text-slate-400 whitespace-nowrap ${className}`}>
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
      >
        {label}
        <span className="text-xs opacity-60">{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  )
}

function JsonBlock({ label, value }) {
  const text = value == null ? null : (typeof value === 'string' ? value : JSON.stringify(value, null, 2))
  return (
    <div>
      <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      {text != null
        ? <pre className="text-emerald-300 bg-slate-950 border border-slate-800 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words max-h-36">{text}</pre>
        : <span className="text-slate-600">—</span>
      }
    </div>
  )
}

function LogDetailPanel({ log }) {
  const overview = [
    ['request_id', log.request_id ?? '—'],
    ['timestamp',  log.created_at ? new Date(log.created_at).toISOString() : '—'],
    ['method',     log.method],
    ['path',       log.path],
    ['status',     log.status_code ?? '—'],
    ['duration',   log.duration_ms != null ? `${log.duration_ms} ms` : '—'],
    ['ip_address', log.ip_address ?? '—'],
    ['user',       log.username ?? (log.user_id ? String(log.user_id).slice(0, 8) + '…' : '—')],
  ]
  return (
    <div className="bg-slate-900 text-slate-200 font-mono text-xs p-4 flex flex-col gap-4">
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-0.5">
          {overview.map(([k, v]) => (
            <div key={k} className="flex gap-2 py-0.5 border-b border-slate-800">
              <span className="text-slate-500 w-24 shrink-0">{k}</span>
              <span className="text-slate-200 break-all">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
      {log.user_agent && (
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">User Agent</p>
          <p className="text-slate-300 break-all leading-relaxed">{log.user_agent}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <JsonBlock label="Query Params" value={log.query_params} />
        <JsonBlock label="Request Body" value={log.request_body} />
        <JsonBlock label="Error Detail" value={log.error_detail} />
      </div>
    </div>
  )
}

// ── Delete confirmation ───────────────────────────────────────────────────────

const CONFIRM_PHRASES = [
  (n) => ({ prompt: `Type "yes, nuke ${n}" to confirm`, answer: `yes, nuke ${n}` }),
  (_) => ({ prompt: 'Type "delete these forever"',      answer: 'delete these forever' }),
  (_) => ({ prompt: 'Type "i know what i am doing"',   answer: 'i know what i am doing' }),
]

function DeleteConfirmModal({ count, isAll, onConfirm, onCancel, loading }) {
  const [input, setInput] = useState('')
  const phrase = useRef(CONFIRM_PHRASES[Math.floor(Math.random() * CONFIRM_PHRASES.length)](count)).current
  const valid = input.trim().toLowerCase() === phrase.answer

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">🗑️</span>
          <div>
            <p className="text-white font-bold text-sm">{isAll ? 'Clear all logs' : `Delete ${count} log${count !== 1 ? 's' : ''}`}</p>
            <p className="text-red-200 text-xs mt-0.5">Permanent — no undo</p>
          </div>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You are about to permanently delete{' '}
            <span className="font-bold text-red-600 dark:text-red-400">{isAll ? 'all logs' : `${count} log${count !== 1 ? 's' : ''}`}</span>.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{phrase.prompt}</p>
          </div>
          <input
            autoFocus
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && valid && !loading) onConfirm() }}
            placeholder={phrase.answer}
            className="input text-sm"
          />
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={!valid || loading}
            className="text-sm px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Deleting…' : '💥 Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MonitoringDashboard({ toast }) {
  // Data state
  const [stats, setStats]     = useState(null)
  const [logs, setLogs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(0)
  const [loading, setLoading] = useState(true)

  // Filter state (display — path is debounced before API call)
  const [filters, setFilters] = useState({ method: '', status: '', path: '' })

  // Sort state (client-side, within current page)
  const [sortBy, setSortBy]   = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  // UI state
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selected, setSelected]       = useState(new Set())
  const [expanded, setExpanded]       = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  // Refs for stable fetchData
  const stateRef       = useRef({ page: 0, filters: { method: '', status: '', path: '' } })
  const pathDebounceRef = useRef(null)
  const autoRefreshRef  = useRef(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const { page: pg, filters: filt } = stateRef.current
    setLoading(true)
    try {
      const [statsRes, logsRes] = await Promise.all([
        getRequestLogStats(),
        getRequestLogs({
          limit: PAGE_SIZE,
          offset: pg * PAGE_SIZE,
          method: filt.method || undefined,
          path:   filt.path   || undefined,
          ...statusRange(filt.status),
        }),
      ])
      setStats(statsRes)
      setLogs(logsRes.logs)
      setTotal(logsRes.total)
    } catch (err) {
      toast({ message: err.message, type: 'error', detail: err.detail })
    } finally {
      setLoading(false)
    }
  }, [toast]) // stable — reads page/filters from stateRef

  // Always keep ref current
  stateRef.current = { page, filters }

  // Initial load
  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    clearInterval(autoRefreshRef.current)
    if (autoRefresh) autoRefreshRef.current = setInterval(fetchData, 10_000)
    return () => clearInterval(autoRefreshRef.current)
  }, [autoRefresh, fetchData])

  // ── Filter / page helpers ─────────────────────────────────────────────────

  function applyFilters(newFilters, newPage = 0) {
    stateRef.current = { page: newPage, filters: newFilters }
    setFilters(newFilters)
    setPage(newPage)
    setSelected(new Set())
    setExpanded(null)
    fetchData()
  }

  function handleMethodChange(e) { applyFilters({ ...filters, method: e.target.value }) }
  function handleStatusChange(e) { applyFilters({ ...filters, status: e.target.value }) }

  function handlePathChange(e) {
    const path = e.target.value
    setFilters(f => ({ ...f, path }))
    clearTimeout(pathDebounceRef.current)
    pathDebounceRef.current = setTimeout(() => {
      applyFilters({ ...stateRef.current.filters, path })
    }, PATH_DEBOUNCE_MS)
  }

  function goToPage(newPage) {
    stateRef.current = { ...stateRef.current, page: newPage }
    setPage(newPage)
    fetchData()
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  function toggleSort(field) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const sortedLogs = useMemo(() => {
    if (!sortBy) return logs
    return [...logs].sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy]
      if (va == null) va = sortBy === 'duration_ms' ? Infinity : ''
      if (vb == null) vb = sortBy === 'duration_ms' ? Infinity : ''
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
      return (va < vb ? -1 : va > vb ? 1 : 0) * (sortDir === 'asc' ? 1 : -1)
    })
  }, [logs, sortBy, sortDir])

  const sortProps = (field) => ({ field, sortBy, sortDir, onSort: toggleSort })

  // ── Selection ─────────────────────────────────────────────────────────────

  const allOnPageSelected = sortedLogs.length > 0 && sortedLogs.every(l => selected.has(l.id))

  function toggleCheck(id) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function toggleSelectPage() {
    if (allOnPageSelected) {
      setSelected(prev => { const s = new Set(prev); sortedLogs.forEach(l => s.delete(l.id)); return s })
    } else {
      setSelected(prev => { const s = new Set(prev); sortedLogs.forEach(l => s.add(l.id)); return s })
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  function requestDeleteSelected() {
    const ids = [...selected]
    if (!ids.length) return
    setDeleteTarget({ count: ids.length, isAll: false, ids })
  }

  function requestDeleteAll() {
    setDeleteTarget({ count: total, isAll: true, ids: null })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteRequestLogs(deleteTarget.ids ? { ids: deleteTarget.ids } : {})
      setSelected(new Set())
      setDeleteTarget(null)
      setExpanded(null)
      applyFilters(stateRef.current.filters, 0)
      toast({ message: `Deleted ${deleteTarget.count} log${deleteTarget.count !== 1 ? 's' : ''}`, type: 'success' })
    } catch (err) {
      toast({ message: err.message, type: 'error', detail: err.detail })
    } finally {
      setDeleting(false)
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const totalPages  = Math.ceil(total / PAGE_SIZE)
  const errorRate   = stats && stats.total > 0 ? ((stats.errors_total / stats.total) * 100).toFixed(1) : '0.0'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Requests (last hour)" value={stats?.last_hour ?? '—'} sub={`${stats?.total ?? '—'} total`} accent="blue" />
        <StatCard label="Error rate (5xx)" value={stats ? `${errorRate}%` : '—'} sub={`${stats?.errors_last_hour ?? '—'} last hour`} accent="red" />
        <StatCard label="Avg response" value={stats?.avg_duration_ms ? `${stats.avg_duration_ms} ms` : '—'} sub={`p95: ${stats?.p95_duration_ms ?? '—'} ms`} accent="amber" />
        <StatCard label="Top path (1h)" value={stats?.top_paths?.[0]?.path ?? '—'} sub={stats?.top_paths?.[0] ? `${stats.top_paths[0].count} hits · ${stats.top_paths[0].avg_ms} ms avg` : null} accent="green" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={filters.method} onChange={handleMethodChange} className="input text-sm py-1.5 w-28">
          <option value="">All methods</option>
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filters.status} onChange={handleStatusChange} className="input text-sm py-1.5 w-28">
          <option value="">All statuses</option>
          <option value="2xx">2xx</option>
          <option value="3xx">3xx</option>
          <option value="4xx">4xx</option>
          <option value="5xx">5xx</option>
        </select>
        <input
          type="text"
          placeholder="Filter path…"
          value={filters.path}
          onChange={handlePathChange}
          className="input text-sm py-1.5 flex-1 min-w-40"
        />
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-slate-400 cursor-pointer select-none">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
            Auto (10s)
          </label>
          <button onClick={fetchData} disabled={loading} className="btn-secondary text-sm py-1.5 px-3">
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            onClick={requestDeleteAll}
            disabled={total === 0}
            title="Clear all logs"
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Selection toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg">
          <span className="text-sm text-sky-700 dark:text-sky-300 font-medium">
            {selected.size} log{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="text-xs text-stone-500 hover:text-stone-700 dark:text-slate-400">
              Clear
            </button>
            <button
              onClick={requestDeleteSelected}
              className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete {selected.size}
            </button>
          </div>
        </div>
      )}

      {/* Log table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/50">
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && !allOnPageSelected }}
                    onChange={toggleSelectPage}
                    className="rounded"
                  />
                </th>
                <SortTh field="created_at"  label="Time"     {...sortProps('created_at')} />
                <SortTh field="method"      label="Method"   {...sortProps('method')} />
                <SortTh field="path"        label="Path"     {...sortProps('path')} />
                <SortTh field="status_code" label="Status"   {...sortProps('status_code')} />
                <SortTh field="duration_ms" label="Duration" {...sortProps('duration_ms')} />
                <SortTh field="username"    label="User"     {...sortProps('username')} />
                <SortTh field="ip_address"  label="IP"       {...sortProps('ip_address')} />
                <th className="w-8 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {loading && sortedLogs.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-stone-400">Loading…</td></tr>
              ) : sortedLogs.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-stone-400">No requests logged yet</td></tr>
              ) : (
                sortedLogs.flatMap(log => {
                  const isExpanded = expanded === log.id
                  const isSelected = selected.has(log.id)
                  return [
                    <tr
                      key={log.id}
                      className={[
                        'border-b border-stone-100 dark:border-slate-700/50 transition-colors',
                        isExpanded ? 'bg-slate-50 dark:bg-slate-800/60' : 'hover:bg-stone-50 dark:hover:bg-slate-800/30',
                        isSelected ? 'bg-sky-50/60 dark:bg-sky-950/20' : '',
                      ].join(' ')}
                    >
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleCheck(log.id)} className="rounded" />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-stone-500 dark:text-slate-400 whitespace-nowrap cursor-pointer" onClick={() => setExpanded(isExpanded ? null : log.id)}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="block text-stone-400 dark:text-slate-500 text-xs">{new Date(log.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-3 py-2 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : log.id)}>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${METHOD_COLORS[log.method] ?? 'bg-stone-100 text-stone-600'}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 max-w-xs cursor-pointer" onClick={() => setExpanded(isExpanded ? null : log.id)}>
                        <span className="block truncate" title={log.path}>{log.path}</span>
                        {log.query_params && (
                          <span className="text-stone-400 dark:text-slate-500 text-xs truncate block">
                            ?{Object.entries(log.query_params).map(([k, v]) => `${k}=${v}`).join('&')}
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-2 font-mono font-semibold cursor-pointer ${statusColor(log.status_code)}`} onClick={() => setExpanded(isExpanded ? null : log.id)}>
                        {log.status_code ?? '—'}
                      </td>
                      <td className={`px-3 py-2 font-mono text-xs cursor-pointer ${durationColor(log.duration_ms)}`} onClick={() => setExpanded(isExpanded ? null : log.id)}>
                        {log.duration_ms != null ? `${log.duration_ms} ms` : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs cursor-pointer" onClick={() => setExpanded(isExpanded ? null : log.id)}>
                        {log.username
                          ? <span className="font-medium text-slate-700 dark:text-slate-300">{log.username}</span>
                          : log.user_id
                            ? <span className="font-mono text-stone-400">{String(log.user_id).slice(0, 8)}…</span>
                            : <span className="text-stone-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-stone-400 dark:text-slate-500 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : log.id)}>
                        {log.ip_address ?? '—'}
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => setExpanded(isExpanded ? null : log.id)} className="text-stone-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                    </tr>,
                    isExpanded && (
                      <tr key={`${log.id}-detail`} className="border-b border-slate-700">
                        <td colSpan={9} className="p-0"><LogDetailPanel log={log} /></td>
                      </tr>
                    ),
                  ].filter(Boolean)
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 dark:border-slate-700">
            <span className="text-sm text-stone-500 dark:text-slate-400">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button onClick={() => goToPage(page - 1)} disabled={page === 0} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">Previous</button>
              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages - 1} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Top paths */}
      {stats?.top_paths?.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Top paths — last hour</h3>
          <div className="flex flex-col gap-1">
            {stats.top_paths.map(p => {
              const pct = stats.last_hour > 0 ? Math.round((p.count / stats.last_hour) * 100) : 0
              return (
                <div key={p.path} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300 w-56 truncate" title={p.path}>{p.path}</span>
                  <div className="flex-1 bg-stone-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400 w-16 text-right">{p.count} hits</span>
                  <span className="text-xs text-stone-400 dark:text-slate-500 w-20 text-right">{p.avg_ms} ms avg</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          count={deleteTarget.count}
          isAll={deleteTarget.isAll}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default MonitoringDashboard
