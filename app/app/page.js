import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { serverFetch } from '../../lib/serverFetch.js'
import { DashboardContent } from './DashboardContent.js'

export default async function DashboardPage() {
  const token = cookies().get('leaflet_token')?.value
  if (!token) redirect('/landing')

  const [profile, books, incoming, outgoing, transfers, loans] = await Promise.all([
    serverFetch('/users/me', token),  // memoized — layout already fetched this
    serverFetch('/books', token),
    serverFetch('/requests/incoming', token),
    serverFetch('/requests/outgoing', token),
    serverFetch('/transfers', token),
    serverFetch('/loans', token),
  ])

  if (!profile) redirect('/landing')
  if (profile.approval_status === 'pending') redirect('/pending')
  if (profile.approval_status === 'rejected') redirect('/landing')

  return (
    <DashboardContent
      initialBooks={books ?? []}
      initialIncoming={incoming ?? []}
      initialOutgoing={outgoing ?? []}
      initialTransfers={transfers ?? []}
      initialLoans={loans ?? []}
    />
  )
}
