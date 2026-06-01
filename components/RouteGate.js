'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider.js'

export function RouteGate({ children, requireAuth = true, requireApproved = false, requireAdmin = false }) {
  const { profile, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (requireAuth && !profile) {
      router.replace('/landing')
      return
    }
    if (requireApproved && profile?.approval_status === 'pending') {
      router.replace('/pending')
      return
    }
    if (requireApproved && profile?.approval_status === 'rejected') {
      router.replace('/landing')
      return
    }
    if (requireAdmin && role !== 'admin' && role !== 'super_admin') {
      router.replace('/app')
      return
    }
  }, [loading, profile, role, requireAuth, requireApproved, requireAdmin, router])

  if (requireAuth && !profile && !loading) return null
  if (requireApproved && profile?.approval_status !== 'approved' && !loading) return null
  if (requireAdmin && role !== 'admin' && role !== 'super_admin' && !loading) return null

  return children
}

export default RouteGate
