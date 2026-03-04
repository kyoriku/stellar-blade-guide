import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function useComments(contentType: string, contentId: number) {
  return useQuery({
    queryKey: ['comments', contentType, contentId],
    queryFn: () => api.getComments(contentType, contentId),
    enabled: !!contentType && !!contentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useInvalidateComments() {
  const queryClient = useQueryClient()
  return (contentType: string, contentId: number) => {
    queryClient.invalidateQueries({ queryKey: ['comments', contentType, contentId] })
  }
}