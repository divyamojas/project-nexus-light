'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const ToastContext = createContext(null)

let toastId = 0

// Parse a potentially JSON error message into { displayMsg, detail }
function parseErrorMessage(message, explicitDetail) {
  if (explicitDetail !== undefined) {
    return { displayMsg: message, detail: explicitDetail }
  }
  if (typeof message !== 'string') return { displayMsg: String(message), detail: null }
  try {
    const parsed = JSON.parse(message)
    if (parsed && typeof parsed === 'object') {
      const displayMsg =
        (typeof parsed.detail === 'string' ? parsed.detail : null) ||
        (typeof parsed.message === 'string' ? parsed.message : null) ||
        message
      return { displayMsg, detail: parsed }
    }
  } catch {}
  return { displayMsg: message, detail: null }
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function ErrorDetailModal({ entry, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const detailText = entry.detail != null
    ? (typeof entry.detail === 'string' ? entry.detail : JSON.stringify(entry.detail, null, 2))
    : null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={ref}
        className="relative z-10 w-full max-w-xl bg-slate-900 text-slate-200 rounded-xl shadow-2xl border border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-semibold text-slate-100">Error Detail</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* Message */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Message</p>
            <p className="text-sm text-red-300 font-medium">{entry.displayMsg}</p>
          </div>

          {/* Timestamp */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Timestamp</p>
            <p className="text-xs text-slate-400 font-mono">{new Date(entry.ts).toISOString()}</p>
          </div>

          {/* API context */}
          {(entry.apiUrl || entry.apiMethod) && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Request</p>
              <p className="text-xs text-slate-300 font-mono">
                {entry.apiMethod && <span className="text-amber-400 mr-2">{entry.apiMethod}</span>}
                {entry.apiUrl}
              </p>
              {entry.status && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">Status: {entry.status}</p>
              )}
            </div>
          )}

          {/* Full detail */}
          {detailText && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Response Body</p>
                <CopyButton text={detailText} />
              </div>
              <pre className="text-xs text-emerald-300 bg-slate-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words border border-slate-800">
                {detailText}
              </pre>
            </div>
          )}

          {!detailText && !entry.apiUrl && (
            <p className="text-xs text-slate-500 italic">No additional detail available.</p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-700 bg-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [errorModal, setErrorModal] = useState(null)

  const toast = useCallback(({ message, type = 'info', detail, status, apiUrl, apiMethod }) => {
    const id = ++toastId
    const ts = Date.now()

    let displayMsg = message
    let fullDetail = detail

    if (type === 'error') {
      const parsed = parseErrorMessage(message, detail)
      displayMsg = parsed.displayMsg
      fullDetail = parsed.detail
    }

    const entry = { id, displayMsg, detail: fullDetail, type, ts, status, apiUrl, apiMethod, message }
    setToasts(prev => [...prev, entry])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, type === 'error' ? 5000 : 3000)
  }, [])

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  function openDetail(entry) {
    setErrorModal(entry)
  }

  // Global unhandled promise rejection → toast
  useEffect(() => {
    function onUnhandledRejection(event) {
      const err = event.reason
      if (!err) return
      toast({
        message: err.message || 'Unhandled error',
        type: 'error',
        detail: err.detail,
        status: err.status,
        apiUrl: err.apiUrl,
        apiMethod: err.apiMethod,
      })
    }
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', onUnhandledRejection)
  }, [toast])

  const typeStyles = {
    success: 'bg-emerald-600 dark:bg-emerald-500 text-white',
    error:   'bg-red-600 dark:bg-red-500 text-white',
    info:    'bg-slate-800 dark:bg-slate-700 text-white',
  }

  const typeIcons = {
    success: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => {
          const hasDetail = t.type === 'error' && (t.detail != null || t.apiUrl)
          return (
            <div
              key={t.id}
              onClick={hasDetail ? () => openDetail(t) : undefined}
              className={[
                typeStyles[t.type] ?? typeStyles.info,
                'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium',
                hasDetail ? 'cursor-pointer hover:brightness-110 transition-all' : '',
              ].join(' ')}
            >
              <span className="mt-0.5">{typeIcons[t.type] ?? typeIcons.info}</span>
              <span className="flex-1 leading-snug">{t.displayMsg}</span>
              {hasDetail && (
                <span className="text-xs opacity-70 whitespace-nowrap self-center underline underline-offset-2">
                  details ↗
                </span>
              )}
              <button
                onClick={e => { e.stopPropagation(); dismiss(t.id) }}
                className="opacity-70 hover:opacity-100 transition-opacity self-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {errorModal && (
        <ErrorDetailModal
          entry={errorModal}
          onClose={() => setErrorModal(null)}
        />
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

export default ToastProvider
