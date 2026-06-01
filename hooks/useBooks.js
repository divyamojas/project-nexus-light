'use client'

import useSWR from 'swr'
import { fetcher } from '../lib/fetcher.js'

export function useBooks(params = {}) {
  const query = new URLSearchParams()
  if (params.source && params.source !== 'all') query.set('source', params.source)
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.archived !== undefined) query.set('archived', String(params.archived))
  const key = `/books${query.toString() ? '?' + query.toString() : ''}`

  const { data, error, isLoading, mutate } = useSWR(key, fetcher)
  return { books: data ?? [], error, isLoading, mutate }
}
