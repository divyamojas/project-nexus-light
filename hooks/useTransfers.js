'use client'

import useSWR from 'swr'
import { fetcher } from '../lib/fetcher.js'

export function useTransfers() {
  const { data, error, isLoading, mutate } = useSWR('/transfers', fetcher)
  return { transfers: data ?? [], error, isLoading, mutate }
}
