'use client'

import useSWR from 'swr'
import { fetcher } from '../lib/fetcher.js'

export function useLoans() {
  const { data, error, isLoading, mutate } = useSWR('/loans', fetcher)
  return { loans: data ?? [], error, isLoading, mutate }
}
