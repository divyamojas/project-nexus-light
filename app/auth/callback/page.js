'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setToken } from '../../../lib/auth.js'
import PageLoader from '../../../components/PageLoader.js'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Extract token from URL hash or query params
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)

    let token = null

    // Try URL hash first: #access_token=...
    if (hash) {
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
      token = hashParams.get('access_token')
    }

    // Fallback: query param
    if (!token) {
      token = params.get('access_token')
    }

    if (token) {
      setToken(token)
      router.replace('/app')
    } else {
      // No token found — redirect to auth
      router.replace('/auth')
    }
  }, [router])

  return <PageLoader />
}
