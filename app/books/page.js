import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { serverFetch } from '../../lib/serverFetch.js'
import { BooksContent } from './BooksContent.js'

export default async function BooksPage() {
  const token = cookies().get('leaflet_token')?.value
  if (!token) redirect('/landing')

  const [profile, books] = await Promise.all([
    serverFetch('/users/me', token),  // memoized — layout already fetched this
    serverFetch('/books', token),
  ])

  if (!profile) redirect('/landing')
  if (profile.approval_status === 'pending') redirect('/pending')
  if (profile.approval_status === 'rejected') redirect('/landing')

  return <BooksContent initialBooks={books ?? []} />
}
