// Inline token getter to avoid circular dependency with auth.js
function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('leaflet_token') || null
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const res = await fetch(base + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  // Handle 204 No Content
  if (res.status === 204) return null
  return res.json()
}
