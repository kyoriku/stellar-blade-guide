import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

// Keep query keys in sync with usePrefetch — it warms these exact keys.
export function useLevelCollectibles(levelName: string) {
  return useQuery({
    queryKey: ['level-collectibles', levelName],
    queryFn: () => api.getLevelCollectibles(levelName),
    enabled: !!levelName,
  })
}

export function useCollectiblesByType(typeName: string, category: string = 'collectibles', enabled: boolean = true) {
  return useQuery({
    queryKey: ['type-collectibles', category, typeName],
    queryFn: () => {
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
    enabled: !!typeName && enabled,
  })
}