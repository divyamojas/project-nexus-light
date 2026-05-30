'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getToken, clearToken, login as authLogin, logout as authLogout, signup as authSignup, resetPassword as authReset } from '../lib/auth.js'
import { apiFetch } from '../lib/api.js'
import { cacheProfile, getCachedProfile, clearAll } from '../lib/storage.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      // Load cached profile instantly
      const cached = await getCachedProfile()
      if (cached) {
        setProfile(cached)
        setRole(cached.role || 'user')
      }
      // Fetch fresh from backend
      const data = await apiFetch('/users/me')
      setProfile(data)
      setRole(data.role || 'user')
      setUser({ id: data.id, email: data.email || null })
      await cacheProfile(data)
    } catch (err) {
      const msg = err.message || ''
      const isUnauthed = msg.includes('401') || msg.includes('Unauthorized')
      const isMissing  = msg.includes('Profile not found') || msg.includes('404')
      if (isUnauthed || isMissing) {
        clearToken()
        setUser(null)
        setProfile(null)
        setRole('user')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function login(email, password) {
    const data = await authLogin(email, password)
    const profileData = await apiFetch('/users/me')
    setProfile(profileData)
    setRole(profileData.role || 'user')
    setUser({ id: profileData.id, email: profileData.email || null })
    await cacheProfile(profileData)
    return { data, profile: profileData }
  }

  async function logout() {
    await authLogout()
    await clearAll()
    setUser(null)
    setProfile(null)
    setRole('user')
  }

  async function signup(email, password) {
    return authSignup(email, password)
  }

  async function resetPassword(email) {
    return authReset(email)
  }

  async function refreshProfile() {
    try {
      const data = await apiFetch('/users/me')
      setProfile(data)
      setRole(data.role || 'user')
      setUser({ id: data.id, email: data.email || null })
      await cacheProfile(data)
      return data
    } catch (err) {
      console.error('[AuthProvider] refreshProfile error:', err)
      return null
    }
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
