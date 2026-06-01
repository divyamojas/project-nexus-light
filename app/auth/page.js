'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup, resetPassword } from '../../lib/auth.js'
import { useToast } from '../../components/Toast.js'
import { useAuth } from '../../components/AuthProvider.js'

const ALLOWED_DOMAINS = ['sprinklr.com', 'gmail.com']

function validateEmailDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  return ALLOWED_DOMAINS.includes(domain)
}

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function AuthPage() {
  const [view, setView] = useState('login') // login | signup | reset
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) {
      toast({ message: 'Email and password are required', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const { profile } = await login(email.trim(), password)
      if (!profile) {
        router.replace('/onboarding')
      } else if (profile.approval_status === 'pending') {
        router.replace('/pending')
      } else {
        router.replace('/app')
      }
    } catch (err) {
      let message = err.message || 'Login failed'
      try { message = JSON.parse(err.message)?.detail || message } catch {}
      toast({ message, type: 'error', detail: err.detail, status: err.status, apiUrl: err.apiUrl, apiMethod: err.apiMethod })
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup() {
    if (!email.trim() || !password) {
      toast({ message: 'Email and password are required', type: 'error' })
      return
    }
    if (!validateEmailDomain(email.trim())) {
      toast({ message: 'Only @sprinklr.com and @gmail.com emails are allowed', type: 'error' })
      return
    }
    if (password.length < 6) {
      toast({ message: 'Password must be at least 6 characters', type: 'error' })
      return
    }
    setLoading(true)
    try {
      await signup(email.trim(), password)
      setSignupDone(true)
    } catch (err) {
      let message = err.message || 'Signup failed'
      try { message = JSON.parse(err.message)?.detail || message } catch {}
      toast({ message, type: 'error', detail: err.detail, status: err.status, apiUrl: err.apiUrl, apiMethod: err.apiMethod })
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      toast({ message: 'Email is required', type: 'error' })
      return
    }
    setLoading(true)
    try {
      await resetPassword(email.trim())
      setResetDone(true)
    } catch (err) {
      toast({ message: err.message || 'Failed to send reset email', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter') return
    if (view === 'login') handleLogin()
    else if (view === 'signup') handleSignup()
    else if (view === 'reset') handleReset()
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-2xl hover:opacity-80 transition-opacity">
            <span>🌿</span>
            <span>Leaflet</span>
          </Link>
          <p className="text-stone-500 dark:text-slate-400 text-sm mt-1">Community book sharing</p>
        </div>

        <div className="card p-8">
          {/* Tab toggle */}
          <div className="flex rounded-xl overflow-hidden border border-stone-200 dark:border-slate-700 mb-6 p-0.5 bg-stone-50 dark:bg-slate-900/50">
            {[
              { key: 'login', label: 'Sign In' },
              { key: 'signup', label: 'Sign Up' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setView(key); setSignupDone(false); setResetDone(false) }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  view === key
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm'
                    : 'text-stone-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Login form ─────────────────────────────────────────────────── */}
          {view === 'login' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
              <button onClick={handleLogin} disabled={loading} className="btn-primary w-full mt-1">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <button
                onClick={() => { setView('reset'); setResetDone(false) }}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline text-center"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* ── Signup form ────────────────────────────────────────────────── */}
          {view === 'signup' && !signupDone && (
            <div className="flex flex-col gap-4">
              <div className="bg-stone-50 dark:bg-slate-900/50 border border-stone-200 dark:border-slate-700 rounded-lg p-3 text-xs text-stone-500 dark:text-slate-400">
                Only <strong>@sprinklr.com</strong> and <strong>@gmail.com</strong> email addresses are accepted.
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input-field"
                  placeholder="you@gmail.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="input-field pr-10"
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
              <button onClick={handleSignup} disabled={loading} className="btn-primary w-full mt-1">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </div>
          )}

          {signupDone && view === 'signup' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                ✉️
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Check your email</h3>
              <p className="text-sm text-stone-500 dark:text-slate-400">
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </p>
              <button
                onClick={() => { setView('login'); setSignupDone(false) }}
                className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* ── Reset form ─────────────────────────────────────────────────── */}
          {view === 'reset' && !resetDone && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-stone-500 dark:text-slate-400">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <button onClick={handleReset} disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button
                onClick={() => setView('login')}
                className="text-sm text-stone-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-center"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {resetDone && view === 'reset' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                ✅
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Email sent!</h3>
              <p className="text-sm text-stone-500 dark:text-slate-400">
                Check your inbox for a password reset link.
              </p>
              <button
                onClick={() => { setView('login'); setResetDone(false) }}
                className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 dark:text-slate-500 mt-6">
          By signing up you agree to our{' '}
          <Link href="/legal/terms" className="hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
