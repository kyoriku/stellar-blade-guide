// import { useQuery } from '@tanstack/react-query'
// import { api } from '../services/api'

// export function useWalkthroughs() {
//   return useQuery({
//     queryKey: ['walkthroughs'],
//     queryFn: () => api.getWalkthroughs(),
//   })
// }

// export function useWalkthrough(id: number) {
//   return useQuery({
//     queryKey: ['walkthrough', id],
//     queryFn: () => api.getWalkthroughById(id),
//     enabled: !!id,
//   })
// }

// export function useWalkthroughsByType(type: string) {
//   return useQuery({
//     queryKey: ['walkthroughs', type],
//     queryFn: () => api.getWalkthroughsByType(type),
//     enabled: !!type,
//   })
// }

import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

// Get all walkthroughs (if you need this for an overview page)
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

// Get single walkthrough by type + slug (for detail pages) - NEW PRIMARY METHOD
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