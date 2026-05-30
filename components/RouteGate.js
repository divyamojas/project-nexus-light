'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider.js'
import PageLoader from './PageLoader.js'

export function RouteGate({ children, requireAuth = true, requireApproved = false, requireAdmin = false }) {
  const { user, profile, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('leaflet_token') : null

    if (requireAuth && !token) {
      router.replace('/landing')
      return
    }

    if (requireApproved && profile && profile.approval_status === 'pending') {
      router.replace('/pending')
      return
    }

    if (requireApproved && profile && profile.approval_status === 'rejected') {
      router.replace('/landing')
      return
    }

    if (requireAdmin && role !== 'admin' && role !== 'super_admin') {
      router.replace('/app')
      return
    }
  }, [loading, user, profile, role, requireAuth, requireApproved, requireAdmin, router])

  if (loading) return <PageLoader />

  const token = typeof window !== 'undefined' ? localStorage.getItem('leaflet_token') : null

  if (requireAuth && !token) return <PageLoader />
  if (requireApproved && profile?.approval_status === 'pending') return <PageLoader />
  if (requireApproved && profile?.approval_status === 'rejected') return <PageLoader />
  if (requireAdmin && role !== 'admin' && role !== 'super_admin') return <PageLoader />

  return children
}

export default RouteGate
