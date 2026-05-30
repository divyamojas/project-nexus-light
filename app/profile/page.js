'use client'

import RouteGate from '../../components/RouteGate.js'
import ProfileSetup from '../../components/ProfileSetup.js'
import { useAuth } from '../../components/AuthProvider.js'

export default function ProfilePage() {
  return (
    <RouteGate requireAuth requireApproved>
      <ProfileContent />
    </RouteGate>
  )
}

function ProfileContent() {
  const { profile, refreshProfile } = useAuth()

  async function handleComplete(updated) {
    await refreshProfile()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Edit Profile</h1>
        <p className="text-stone-500 dark:text-slate-400 mt-0.5 text-sm">
          Update your public profile information
        </p>
      </div>
      <ProfileSetup
        mode="edit"
        initialData={profile || {}}
        onComplete={handleComplete}
      />
    </div>
  )
}
