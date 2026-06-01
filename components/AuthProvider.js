'use client'

import { createContext, useContext, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { getToken, clearToken, login as authLogin, logout as authLogout, signup as authSignup, resetPassword as authReset } from '../lib/auth.js'
import { fetcher } from '../lib/fetcher.js'
import { clearAll } from '../lib/storage.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children, initialProfile = null }) {
  // activeSession tracks whether we should be fetching /users/me.
  // Initialized from initialProfile (server already verified the token) so there
  // is no client-side loading delay on first render.
  const [activeSession, setActiveSession] = useState(!!initialProfile)

  const { data: profile, mutate: mutateProfile } = useSWR(
    activeSession ? '/users/me' : null,
    fetcher,
    {
      fallbackData: initialProfile,
      onError: (err) => {
        const msg = err.message || ''
        const isAuthError = msg.includes('401') || msg.includes('Unauthorized') ||
                            msg.includes('404') || msg.includes('Profile not found')
        if (isAuthError) {
          clearToken()
          setActiveSession(false)
        }
      },
    }
  )

  const role = profile?.role || 'user'
  const user = profile ? { id: profile.id, email: profile.email || null } : null
  // loading is only true during the brief window after login() before profile arrives
  const loading = activeSession && !profile

  async function login(email, password) {
    const data = await authLogin(email, password)
    // Fetch profile directly — mutateProfile() can't work yet because activeSession is
    // still false, so the SWR key is null. Pre-populate the cache, then activate.
    let profileData = null
    try {
      profileData = await fetcher('/users/me')
      await globalMutate('/users/me', profileData, { revalidate: false })
    } catch {}
    setActiveSession(true)
    return { data, profile: profileData }
  }

  async function logout() {
    try { await authLogout() } catch {}
    clearToken()
    setActiveSession(false)
    await clearAll()
    // Clear all SWR cache so stale data doesn't leak to the next session
    await globalMutate(() => true, undefined, { revalidate: false })
  }

  async function signup(email, password) {
    return authSignup(email, password)
  }

  async function resetPassword(email) {
    return authReset(email)
  }

  async function refreshProfile() {
    return mutateProfile()
  }

  const value = {
    user,
    profile,
    role,
    loading,
    isAuthenticated: !!(user && profile),
    login,
    logout,
    signup,
    resetPassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthProvider
