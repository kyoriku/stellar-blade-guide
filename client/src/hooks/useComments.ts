import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export function useComments(contentType: string, contentId: number) {
  return useQuery({
    queryKey: ['comments', contentType, contentId],
    queryFn: () => api.getComments(contentType, contentId),
    enabled: !!contentType && !!contentId,
  })
}