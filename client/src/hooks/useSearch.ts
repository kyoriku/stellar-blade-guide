import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export function useSearch(query: string, limit = 20) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(id)
  }, [query])

  // Trimmed before the length check, the key and the request: "nano" and "nano " are
  // one request and one cache entry, and a letter plus a space is not two characters.
  const term = debouncedQuery.trim()
  const result = useQuery({
    queryKey: ['search', term, limit],
    queryFn: ({ signal }) => api.searchAll(term, limit, signal),
    enabled: term.length >= 2,
    staleTime: 5 * 60 * 1000,
    // A failing search shows its error at once, not after the global retries.
    retry: false,
  })

  return { ...result, isPending: query.trim() !== term || result.isLoading }
}
