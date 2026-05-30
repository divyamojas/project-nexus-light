'use client'

import { useState } from 'react'
import { apiFetch } from '../lib/api.js'
import { useToast } from './Toast.js'

export function ProfileSetup({ mode = 'onboarding', initialData = {}, onComplete }) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    username: initialData.username || '',
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    bio: initialData.bio || '',
    avatar_url: initialData.avatar_url || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username is required'
    if (form.username.trim() && !/^[a-zA-Z0-9_.-]+$/.test(form.username.trim())) {
      errs.username = 'Username can only contain letters, numbers, _, ., and -'
    }
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const payload = {}
      if (form.username.trim()) payload.username = form.username.trim()
      if (form.first_name.trim()) payload.first_name = form.first_name.trim()
      if (form.last_name.trim()) payload.last_name = form.last_name.trim()
      if (form.bio.trim()) payload.bio = form.bio.trim()
      if (form.avatar_url.trim()) payload.avatar_url = form.avatar_url.trim()

      const updated = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      toast({ message: mode === 'edit' ? 'Profile updated!' : 'Profile set up!', type: 'success' })
      if (onComplete) onComplete(updated)
    } catch (err) {
      toast({ message: err.message || 'Failed to save profile', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto">
      {mode === 'onboarding' && (
        <div className="mb-6 text-center">
          <div className="text-4xl mb-2">🌿</div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Welcome to Leaflet!</h1>
          <p className="text-stone-500 dark:text-slate-400 mt-1 text-sm">Set up your profile to get started</p>
        </div>
      )}

      <div className="card p-6 flex flex-col gap-5">
        {/* Avatar preview */}
        {form.avatar_url && (
          <div className="flex justify-center">
            <img
              src={form.avatar_url}
              alt="Avatar preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700"
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            className={`input-field ${errors.username ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="your_username"
          />
          {errors.username && (
            <p className="text-xs text-red-500 mt-1">{errors.username}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">First name</label>
            <input
              type="text"
              value={form.first_name}
              onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
              className="input-field"
              placeholder="First"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Last name</label>
            <input
              type="text"
              value={form.last_name}
              onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
              className="input-field"
              placeholder="Last"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            className="input-field resize-none"
            rows={3}
            placeholder="Tell the community about yourself and your reading interests…"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Avatar URL</label>
          <input
            type="url"
            value={form.avatar_url}
            onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))}
            className="input-field"
            placeholder="https://..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full mt-1"
        >
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Get Started'}
        </button>
      </div>
    </div>
  )
}

export default ProfileSetup
