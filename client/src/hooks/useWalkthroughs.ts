import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

// Keep query keys in sync with usePrefetch — it warms these exact keys.
export function useWalkthroughs() {
  return useQuery({
    queryKey: ['walkthroughs'],
    queryFn: () => api.getWalkthroughs(),
  })
}

export function useWalkthroughsByType(type: string) {
  return useQuery({
    queryKey: ['walkthroughs', 'type', type],
    queryFn: () => api.getWalkthroughsByType(type),
    enabled: !!type,
  })
}

export function useWalkthrough(type: string, slug: string) {
  return useQuery({
    queryKey: ['walkthrough', type, slug],
    queryFn: () => api.getWalkthroughBySlug(type, slug),
    enabled: !!type && !!slug,
  })
}