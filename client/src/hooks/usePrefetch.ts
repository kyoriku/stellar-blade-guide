import { useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function usePrefetch() {
  const queryClient = useQueryClient()

  const prefetchLevel = (levelName: string) => {
    queryClient.prefetchQuery({
      queryKey: ['level-collectibles', levelName],
      queryFn: () => api.getLevelCollectibles(levelName),
    })
  }

  const prefetchLocations = (levelName: string) => {
    queryClient.prefetchQuery({
      queryKey: ['locations', levelName],
      queryFn: () => api.getLocations(levelName),
      staleTime: 5 * 60000,
    })
  }

  const prefetchCollectiblesByType = (typeName: string) => {
    queryClient.prefetchQuery({
      queryKey: ['type-collectibles', typeName],
      queryFn: () => api.getCollectiblesByType(typeName),
    })
  }

  const prefetchWalkthrough = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ['walkthrough', id],
      queryFn: () => api.getWalkthroughById(id),
    })
  }

  return {
    prefetchLevel,
    prefetchLocations,
    prefetchCollectiblesByType,
    prefetchWalkthrough,
  }
}