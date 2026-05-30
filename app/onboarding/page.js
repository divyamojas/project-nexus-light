'use client'

import { useRouter } from 'next/navigation'
import RouteGate from '../../components/RouteGate.js'
import ProfileSetup from '../../components/ProfileSetup.js'
import { useAuth } from '../../components/AuthProvider.js'

export default function OnboardingPage() {
  const router = useRouter()
  const { refreshProfile } = useAuth()

  async function handleComplete() {
    // Set onboarding cookie
    document.cookie = 'leaflet_onboarded=true; path=/; SameSite=Lax'
    await refreshProfile()
    router.replace('/app')
  }

  return (
    <RouteGate requireAuth={true} requireApproved={false}>
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
        <ProfileSetup mode="onboarding" onComplete={handleComplete} />
      </div>
    </RouteGate>
  )
}
