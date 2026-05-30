'use client'

import RouteGate from '../../components/RouteGate.js'
import AdminDashboard from '../../components/AdminDashboard.js'

export default function AdminPage() {
  return (
    <RouteGate requireAuth requireApproved requireAdmin>
      <AdminContent />
    </RouteGate>
  )
}

function AdminContent() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Admin Panel</h1>
        <p className="text-stone-500 dark:text-slate-400 mt-0.5 text-sm">
          Manage users, books, loans, and requests
        </p>
      </div>
      <AdminDashboard />
    </div>
  )
}
