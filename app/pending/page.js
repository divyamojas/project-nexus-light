import Link from 'next/link'

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Illustration */}
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ⏳
        </div>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
          Your account is pending approval
        </h1>

        <p className="text-stone-500 dark:text-slate-400 leading-relaxed mb-2">
          Thanks for signing up for Leaflet! Your account is being reviewed by an administrator.
        </p>
        <p className="text-stone-500 dark:text-slate-400 leading-relaxed mb-8">
          You'll receive an email once your account is approved and you can start borrowing and lending books.
        </p>

        <div className="card p-5 text-left mb-8">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">While you wait…</h2>
          <ul className="space-y-2 text-sm text-stone-500 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
              Think about which books you'd like to share with your community
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
              Prepare a short bio to introduce yourself to other readers
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
              Approvals typically happen within 24 hours
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth"
            className="btn-secondary text-sm px-6 py-2.5"
          >
            Sign in with a different account
          </Link>
        </div>

        <p className="text-xs text-stone-400 dark:text-slate-500 mt-6">
          Questions?{' '}
          <a href="mailto:support@leaflet.app" className="hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  )
}
