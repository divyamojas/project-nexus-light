import { apiFetch } from './api.js'

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('leaflet_token') || null
}

export function setToken(token) {
  localStorage.setItem('leaflet_token', token)
  document.cookie = `leaflet_token=${token}; path=/; SameSite=Strict; Secure`
}

export function clearToken() {
  localStorage.removeItem('leaflet_token')
  document.cookie = 'leaflet_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (data?.access_token) {
    setToken(data.access_token)
  }
  return data
}

export async function signup(email, password) {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } catch (_) {
    // Ignore errors on logout — still clear token
  }
  clearToken()
}

export async function resetPassword(email) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}
