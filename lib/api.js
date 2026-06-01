// Inline token getter to avoid circular dependency with auth.js
function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('leaflet_token') || null
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const base = process.env.NEXT_PUBLIC_API_URL || '/api'
  const method = (options.method || 'GET').toUpperCase()

  let res
  try {
    res = await fetch(base + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    })
  } catch (networkErr) {
    // fetch() itself threw — no response at all (network down, DNS failure, proxy unreachable, etc.)
    const err = new Error(networkErr.message || 'Failed to fetch')
    err.apiUrl = base + path
    err.apiMethod = method
    err.detail = `Network error: ${networkErr.message}`
    throw err
  }

  // Read body as text once so we can both inspect it and parse it
  const text = await res.text()

  if (!res.ok) {
    let detail = null
    try { detail = JSON.parse(text) } catch {}
    const err = new Error(text || `HTTP ${res.status}`)
    err.status = res.status
    err.detail = detail ?? text
    err.apiUrl = base + path
    err.apiMethod = method
    throw err
  }

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (parseErr) {
    // Got a 2xx but the body wasn't JSON — likely an HTML error page from a proxy or Next.js
    const err = new Error(parseErr.message)
    err.apiUrl = base + path
    err.apiMethod = method
    err.status = res.status
    err.detail = `Response was not valid JSON:\n${text.slice(0, 1000)}`
    throw err
  }
}
