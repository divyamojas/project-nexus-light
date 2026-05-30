import Link from 'next/link'

async function fetchPrivacyPolicy() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const res = await fetch(`${base}/legal/privacy`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function PrivacyPage() {
  const data = await fetchPrivacyPolicy()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link href="/landing" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
          ← Back to Leaflet
        </Link>
      </div>

      <div className="card p-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">Privacy Policy</h1>

        {data ? (
          <div className="mt-6 prose prose-slate dark:prose-invert max-w-none">
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
              Privacy Policy — coming soon
            </p>
            <div className="space-y-4 text-stone-600 dark:text-slate-400 text-sm leading-relaxed">
              <p>
                Leaflet is committed to protecting your privacy. We collect only the information
                necessary to provide our community book-sharing service.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">What we collect:</strong> Your email address,
                profile information you provide (name, bio, avatar), and records of books you lend or borrow.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">How we use it:</strong> To operate the platform,
                connect lenders with borrowers, and send essential service notifications.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">Your rights:</strong> You may request deletion
                of your account and data at any time from your profile settings.
              </p>
              <p>
                For any privacy questions, contact us at{' '}
                <a href="mailto:privacy@leaflet.app" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  privacy@leaflet.app
                </a>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
