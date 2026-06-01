// Server-only utility — never import from 'use client' files.
// Uses INTERNAL_API_URL (Docker service name) so the Next.js container
// talks directly to FastAPI without a browser round-trip.
// React cache() deduplicates identical (path, token) calls within a single
// server render, so layout + page fetching the same endpoint costs one request.
import { cache } from 'react'

const API_BASE = process.env.INTERNAL_API_URL || 'http://localhost:8000'

export const serverFetch = cache(async (path, token) => {
  if (!token) return null
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
})
