import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { serverFetch } from '../../../lib/serverFetch.js'
import { BookDetailContent } from './BookDetailContent.js'

export default async function BookDetailPage({ params }) {
  const { id } = params
  const token = cookies().get('leaflet_token')?.value
  if (!token) redirect('/landing')

  const [profile, book, reviews] = await Promise.all([
    serverFetch('/users/me', token),  // memoized — layout already fetched this
    serverFetch(`/books/${id}`, token),
    serverFetch(`/reviews/book/${id}`, token),
  ])

  if (!profile) redirect('/landing')
  if (profile.approval_status === 'pending') redirect('/pending')
  if (profile.approval_status === 'rejected') redirect('/landing')

  return (
    <BookDetailContent
      bookId={id}
      initialBook={book}
      initialReviews={reviews ?? []}
    />
  )
}
