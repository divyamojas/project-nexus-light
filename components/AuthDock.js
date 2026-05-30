'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider.js'
import { getToken } from '../lib/auth.js'
import { formatDisplayName, getInitials } from '../lib/utils.js'

export function AuthDock() {
  const { profile, logout } = useAuth()
  const router = useRouter()
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    setHasToken(!!getToken())
  }, [])

  async function handleLogout() {
    await logout()
    router.replace('/landing')
  }

  if (!hasToken) return null

  if (!profile) {
    return (
      <button
        onClick={handleLogout}
        className="text-xs text-stone-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        Sign out
      </button>
    )
  }

  const displayName = formatDisplayName(profile)
  const initials = getInitials(displayName)

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-stone-200 dark:border-slate-600"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
          {displayName}
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="text-xs text-stone-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}

export default AuthDock
