import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export function useSearch(query: string, limit = 20) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(id)
  }, [query])

  const result = useQuery({
    queryKey: ['search', debouncedQuery, limit],
    queryFn: ({ signal }) => api.searchAll(debouncedQuery, limit, signal),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  })

  return { ...result, isPending: query !== debouncedQuery || result.isLoading }
}
