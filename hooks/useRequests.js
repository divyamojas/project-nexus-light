'use client'

import useSWR from 'swr'
import { fetcher } from '../lib/fetcher.js'

export function useIncomingRequests() {
  const { data, error, isLoading, mutate } = useSWR('/requests/incoming', fetcher)
  return { requests: data ?? [], error, isLoading, mutate }
}

export function useOutgoingRequests() {
  const { data, error, isLoading, mutate } = useSWR('/requests/outgoing', fetcher)
  return { requests: data ?? [], error, isLoading, mutate }
}
