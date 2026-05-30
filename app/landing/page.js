'use client'

import Link from 'next/link'

const FEATURES = [
  {
    icon: '📚',
    title: 'Borrow books',
    desc: 'Find books from people in your community and borrow them for free.',
  },
  {
    icon: '🌱',
    title: 'Lend yours',
    desc: 'Share the books you love with your neighbors and colleagues.',
  },
  {
    icon: '🤝',
    title: 'Connect with readers',
    desc: 'Meet other book lovers, exchange reviews, and grow together.',
  },
]

export default function LandingPage() {
  function scrollToFeatures() {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span>🌿</span>
          <span>Leaflet — Community Book Sharing</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-slate-800 dark:text-slate-200 leading-tight mb-6">
          Share books.{' '}
          <span className="text-emerald-600 dark:text-emerald-400">Build community.</span>
        </h1>

        <p className="text-xl text-stone-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Leaflet connects readers in your community. Lend the books you love,
          discover new ones, and build meaningful connections over shared stories.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth"
            className="btn-primary text-base px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            Get Started — it's free
          </Link>
          <button
            onClick={scrollToFeatures}
            className="btn-secondary text-base px-8 py-3 rounded-xl"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* Decorative divider */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="border-t border-stone-200 dark:border-slate-700" />
      </div>

      {/* Features */}
      <section id="features" className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 text-center mb-12">
          Everything you need to share books
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{f.title}</h3>
              <p className="text-stone-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 dark:bg-emerald-800 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start sharing?</h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Join your community's reading circle today.
          </p>
          <Link
            href="/auth"
            className="inline-block bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8 py-3 rounded-xl text-base transition-colors shadow-md hover:shadow-lg"
          >
            Create your account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
          <span>🌿</span>
          <span>Leaflet</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-stone-500 dark:text-slate-400">
          <Link href="/legal/privacy" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/legal/terms" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Terms of Service
          </Link>
          <Link href="/auth" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Sign In
          </Link>
        </div>
      </footer>
    </div>
  )
}
