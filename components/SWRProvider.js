'use client'

import { SWRConfig } from 'swr'

// LRU cache bounded at MAX entries. Oldest key is evicted when full.
// Prevents unbounded memory growth as the user navigates many routes.
function lruProvider() {
  const MAX = 30
  const map = new Map()
  return {
    get: k => map.get(k),
    set: (k, v) => {
      if (map.has(k)) map.delete(k)          // re-insert to refresh recency
      else if (map.size >= MAX) map.delete(map.keys().next().value) // evict LRU
      map.set(k, v)
    },
    delete: k => map.delete(k),
    keys: () => map.keys(),
  }
}

export function SWRProvider({ children }) {
  return (
    <SWRConfig value={{
      provider: lruProvider,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      errorRetryCount: 2,
    }}>
      {children}
    </SWRConfig>
  )
}

export default SWRProvider
