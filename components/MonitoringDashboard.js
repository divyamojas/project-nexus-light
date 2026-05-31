'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getRequestLogs, getRequestLogStats } from '../lib/admin.js'

const METHOD_COLORS = {
  GET:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  POST:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PUT:    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PATCH:  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function statusColor(code) {
  if (!code) return 'text-stone-400'
  if (code < 300) return 'text-emerald-600 dark:text-emerald-400'
  if (code < 400) return 'text-blue-500 dark:text-blue-400'
  if (code < 500) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function durationColor(ms) {
  if (!ms) return 'text-stone-400'
  if (ms < 100)  return 'text-emerald-600 dark:text-emerald-400'
  if (ms < 500)  return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function StatCard({ label, value, sub, accent }) {
  const accentMap = {
    blue:   'border-l-blue-500',
    green:  'border-l-emerald-500',
    red:    'border-l-red-500',
    amber:  'border-l-amber-500',
  }
  return (
    <div className={`card p-4 border-l-4 ${accentMap[accent] ?? 'border-l-stone-300'}`}>
      <p className="text-xs text-stone-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

const PAGE_SIZE = 100

export function MonitoringDashboard({ toast }) {
  const [stats, setStats]         = useState(null)
  const [logs, setLogs]           = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(0)
  const [loading, setLoading]     = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [filters, setFilters]     = useState({
    method: '', status: '', path: '',
  })
  const timerRef = useRef(null)

  const statusRange = (val) => {
    if (val === '2xx') return { status_gte: 200, status_lte: 299 }
    if (val === '3xx') return { status_gte: 300, status_lte: 399 }
    if (val === '4xx') return { status_gte: 400, status_lte: 499 }
    if (val === '5xx') return { status_gte: 500, status_lte: 599 }
    return {}
  }

  const fetchData = useCallback(async (currentPage = page) => {
    setLoading(true)
    try {
      const [statsRes, logsRes] = await Promise.all([
        getRequestLogStats(),
        getRequestLogs({
          limit: PAGE_SIZE,
          offset: currentPage * PAGE_SIZE,
          method: filters.method || undefined,
          path: filters.path || undefined,
          ...statusRange(filters.status),
        }),
      ])
      setStats(statsRes)
      setLogs(logsRes.logs)
      setTotal(logsRes.total)
    } catch (err) {
      toast('error', 'Failed to load monitoring data')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchData(0)
    setPage(0)
  }, [filters])

  useEffect(() => {
    fetchData(page)
  }, [page])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (autoRefresh) {
      timerRef.current = setInterval(() => fetchData(page), 10_000)
    }
    return () => clearInterval(timerRef.current)
  }, [autoRefresh, fetchData, page])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const errorRate = stats
    ? stats.total > 0
      ? ((stats.errors_total / stats.total) * 100).toFixed(1)
      : '0.0'
    : null

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Requests (last hour)"
          value={stats?.last_hour ?? '—'}
          sub={`${stats?.total ?? '—'} total logged`}
          accent="blue"
        />
        <StatCard
          label="Error rate (5xx)"
          value={errorRate != null ? `${errorRate}%` : '—'}
          sub={`${stats?.errors_last_hour ?? '—'} errors last hour`}
          accent="red"
        />
        <StatCard
          label="Avg response time"
          value={stats?.avg_duration_ms ? `${stats.avg_duration_ms} ms` : '—'}
          sub={`p95: ${stats?.p95_duration_ms ?? '—'} ms`}
          accent="amber"
        />
        <StatCard
          label="Top path (last hour)"
          value={stats?.top_paths?.[0]?.path ?? '—'}
          sub={stats?.top_paths?.[0] ? `${stats.top_paths[0].count} hits · ${stats.top_paths[0].avg_ms} ms avg` : null}
          accent="green"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filters.method}
          onChange={e => setFilters(f => ({ ...f, method: e.target.value }))}
          className="input text-sm py-1.5 w-28"
        >
          <option value="">All methods</option>
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="input text-sm py-1.5 w-28"
        >
          <option value="">All statuses</option>
          <option value="2xx">2xx Success</option>
          <option value="3xx">3xx Redirect</option>
          <option value="4xx">4xx Client error</option>
          <option value="5xx">5xx Server error</option>
        </select>

        <input
          type="text"
          placeholder="Filter path..."
          value={filters.path}
          onChange={e => setFilters(f => ({ ...f, path: e.target.value }))}
          className="input text-sm py-1.5 flex-1 min-w-40"
        />

        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (10s)
          </label>
          <button
            onClick={() => fetchData(page)}
            disabled={loading}
            className="btn-secondary text-sm py-1.5 px-3"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Log table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-2.5 font-medium text-stone-500 dark:text-slate-400 whitespace-nowrap">Time</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-500 dark:text-slate-400">Method</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-500 dark:text-slate-400">Path</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-500 dark:text-slate-400">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-500 dark:text-slate-400">Duration</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-500 dark:text-slate-400">User</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-500 dark:text-slate-400">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400 dark:text-slate-500">
                    No requests logged yet
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr
                    key={log.id}
                    className="border-b border-stone-100 dark:border-slate-700/50 hover:bg-stone-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-stone-500 dark:text-slate-400 whitespace-nowrap font-mono text-xs">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="block text-stone-400 dark:text-slate-500 text-xs">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${METHOD_COLORS[log.method] ?? 'bg-stone-100 text-stone-600'}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate" title={log.path}>
                      {log.path}
                    </td>
                    <td className={`px-4 py-2 font-mono font-semibold ${statusColor(log.status_code)}`}>
                      {log.status_code ?? '—'}
                    </td>
                    <td className={`px-4 py-2 font-mono text-xs ${durationColor(log.duration_ms)}`}>
                      {log.duration_ms != null ? `${log.duration_ms} ms` : '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-stone-600 dark:text-slate-300">
                      {log.username
                        ? <span className="font-medium">{log.username}</span>
                        : log.user_id
                          ? <span className="font-mono text-stone-400 dark:text-slate-500">{String(log.user_id).slice(0, 8)}…</span>
                          : <span className="text-stone-300 dark:text-slate-600">—</span>
                      }
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-stone-400 dark:text-slate-500">
                      {log.ip_address ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 dark:border-slate-700">
            <span className="text-sm text-stone-500 dark:text-slate-400">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="btn-secondary text-sm py-1 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="btn-secondary text-sm py-1 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top paths breakdown */}
      {stats?.top_paths?.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Top paths — last hour
          </h3>
          <div className="flex flex-col gap-1">
            {stats.top_paths.map(p => {
              const pct = stats.last_hour > 0 ? Math.round((p.count / stats.last_hour) * 100) : 0
              return (
                <div key={p.path} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300 w-56 truncate" title={p.path}>
                    {p.path}
                  </span>
                  <div className="flex-1 bg-stone-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400 w-16 text-right">
                    {p.count} hits
                  </span>
                  <span className="text-xs text-stone-400 dark:text-slate-500 w-20 text-right">
                    {p.avg_ms} ms avg
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MonitoringDashboard
