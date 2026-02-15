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
    })
  }

  // UPDATE THIS FUNCTION - add category parameter
  const prefetchCollectiblesByType = (typeName: string, category: string = 'collectibles') => {
    queryClient.prefetchQuery({
      queryKey: ['type-collectibles', category, typeName], // Match the query key structure
      queryFn: () => {
        // Call the correct API based on category
        if (category === 'upgrades') {
          return api.getUpgradesByType(typeName);
        }
        if (category === 'materials') {
          return api.getMaterialsByType(typeName);
        }
        if (category === 'cosmetics') {
          return api.getCosmeticsByType(typeName);
        }
        return api.getCollectiblesByType(typeName);
      },
    })
  }

  const prefetchWalkthrough = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ['walkthrough', id],
      queryFn: () => api.getWalkthroughById(id),
    })
  }

  const prefetchWalkthroughsByType = (type: string) => {
    queryClient.prefetchQuery({
      queryKey: ['walkthroughs', 'type', type],
      queryFn: () => api.getWalkthroughsByType(type),
    })
  }

  const prefetchWalkthroughBySlug = (type: string, slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['walkthrough', type, slug],
      queryFn: () => api.getWalkthroughBySlug(type, slug),
    })
  }

  return {
    prefetchLevel,
    prefetchLocations,
    prefetchCollectiblesByType,
    prefetchWalkthrough,
    prefetchWalkthroughsByType,
    prefetchWalkthroughBySlug,
  }
}