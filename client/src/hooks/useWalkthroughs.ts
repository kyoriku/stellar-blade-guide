import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

// Get all walkthroughs (for homepage or general listing)
export function useWalkthroughs() {
  return useQuery({
    queryKey: ['walkthroughs'],
    queryFn: () => api.getWalkthroughs(),
  })
}

// Get walkthroughs by type (for list pages)
export function useWalkthroughsByType(type: string) {
  return useQuery({
    queryKey: ['walkthroughs', 'type', type],
    queryFn: () => api.getWalkthroughsByType(type),
    enabled: !!type,
  })
}

// Get single walkthrough by type + slug (for detail pages)
export function useWalkthrough(type: string, slug: string) {
  return useQuery({
    queryKey: ['walkthrough', type, slug],
    queryFn: () => api.getWalkthroughBySlug(type, slug),
    enabled: !!type && !!slug,
  })
}

// Get walkthrough by ID (keep for backwards compatibility if needed)
export function useWalkthroughById(id: number) {
  return useQuery({
    queryKey: ['walkthrough', 'id', id],
    queryFn: () => api.getWalkthroughById(id),
    enabled: !!id,
  })
}