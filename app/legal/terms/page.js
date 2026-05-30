import Link from 'next/link'

async function fetchTerms() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const res = await fetch(`${base}/legal/terms`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function TermsPage() {
  const data = await fetchTerms()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link href="/landing" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
          ← Back to Leaflet
        </Link>
      </div>

      <div className="card p-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">Terms of Service</h1>

        {data ? (
          <div className="mt-6">
            <p className="text-sm text-stone-400 dark:text-slate-500 mb-6">
              Last updated: {data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'Recently'}
            </p>
            <div className="text-stone-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
              {data.content || data.text || JSON.stringify(data, null, 2)}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-stone-500 dark:text-slate-400 text-sm mb-6">
              Terms of Service — coming soon
            </p>
            <div className="space-y-4 text-stone-600 dark:text-slate-400 text-sm leading-relaxed">
              <p>
                Welcome to Leaflet, a community book-sharing platform. By using Leaflet,
                you agree to these terms.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">Community standards:</strong> Treat all
                community members with respect. Only request books you genuinely intend to borrow, and
                return them in the condition you received them.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">Your account:</strong> You are responsible
                for all activity on your account. Keep your credentials secure and notify us immediately
                of any unauthorized access.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">Book lending:</strong> Leaflet facilitates
                connections between community members but is not responsible for the physical condition of
                books or the fulfillment of lending agreements.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">Eligibility:</strong> Leaflet is currently
                open to users with <code className="text-xs bg-stone-100 dark:bg-slate-700 px-1 py-0.5 rounded">@sprinklr.com</code> and{' '}
                <code className="text-xs bg-stone-100 dark:bg-slate-700 px-1 py-0.5 rounded">@gmail.com</code> email addresses only.
              </p>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
              <p>
                Questions? Contact us at{' '}
                <a href="mailto:support@leaflet.app" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  support@leaflet.app
                </a>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
