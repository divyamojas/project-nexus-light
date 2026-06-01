'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
// Supports three challenge modes:
//   'default'   — standard yes / no buttons
//   'type'      — user must type config.expectedInput exactly
//   'countdown' — confirm button unlocks after config.countdown seconds

export function ConfirmDialog({ config }) {
  const [input, setInput]         = useState('')
  const [countdown, setCountdown] = useState(config.countdown ?? 0)

  useEffect(() => {
    if (config.mode !== 'countdown' || countdown === 0) return
    const t = setInterval(() =>
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    , 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') config.onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [config])

  const typeOk      = config.mode !== 'type'      || input.trim() === config.expectedInput
  const countdownOk = config.mode !== 'countdown' || countdown === 0
  const canConfirm  = typeOk && countdownOk

  const headerBg = config.danger ? 'bg-red-600' : 'bg-amber-500'

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) config.onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-red-200 dark:border-slate-700 overflow-hidden">
        <div className={`${headerBg} px-6 py-4`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">{config.emoji ?? '⚠️'}</span>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm">{config.title}</p>
              {config.subtitle && (
                <p className="text-white/80 text-xs mt-0.5 truncate">{config.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{config.message}</p>

          {config.mode === 'type' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-2">
                {config.challenge}
              </p>
              <input
                autoFocus
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && canConfirm) { config.onConfirm(); config.onClose() }
                }}
                placeholder={config.expectedInput}
                className="input text-sm w-full"
              />
            </div>
          )}

          {config.mode === 'countdown' && (
            <div className={`border rounded-lg px-3 py-3 text-center transition-colors ${
              countdown > 0
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            }`}>
              {countdown > 0 ? (
                <>
                  <p className="text-xs text-amber-700 dark:text-amber-400">{config.challenge}</p>
                  <p className="text-4xl font-bold text-amber-500 mt-1 tabular-nums">{countdown}</p>
                </>
              ) : (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Time's up — choose wisely.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={config.onClose} className="btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={() => { config.onConfirm(); config.onClose() }}
            disabled={!canConfirm}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-all text-white
              ${config.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}
              disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {config.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── useConfirm ────────────────────────────────────────────────────────────────
// Returns { requestConfirm, ConfirmDialogNode }.
// Usage:
//   const { requestConfirm, ConfirmDialogNode } = useConfirm()
//   const ok = await requestConfirm({ title, message, ... })
//   if (!ok) return

export function useConfirm() {
  const [dialog, setDialog] = useState(null)
  const resolveRef = useRef(null)

  const requestConfirm = useCallback((config) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setDialog(config)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true)
    setDialog(null)
  }, [])

  const handleClose = useCallback(() => {
    resolveRef.current?.(false)
    setDialog(null)
  }, [])

  const ConfirmDialogNode = dialog
    ? <ConfirmDialog config={{ ...dialog, onConfirm: handleConfirm, onClose: handleClose }} />
    : null

  return { requestConfirm, ConfirmDialogNode }
}

export default ConfirmDialog
