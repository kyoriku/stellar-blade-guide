import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export function useLevels() {
  return useQuery({
    queryKey: ['levels'],
    queryFn: () => api.getLevels(),
  })
}

export function useLocations(levelName: string) {
  return useQuery({
    queryKey: ['locations', levelName],
    queryFn: () => api.getLocations(levelName),
    enabled: !!levelName,
  })
}

export function useLocationCollectibles(levelName: string, locationName: string) {
  return useQuery({
    queryKey: ['collectibles', levelName, locationName],
    queryFn: () => api.getCollectibles(levelName, locationName),
    enabled: !!levelName && !!locationName,
  })
}

export function useLevelCollectibles(levelName: string) {
  return useQuery({
    queryKey: ['level-collectibles', levelName],
    queryFn: () => api.getLevelCollectibles(levelName),
    enabled: !!levelName,
  })
}

export function useCollectiblesByType(typeName: string) {
  return useQuery({
    queryKey: ['type-collectibles', typeName],
    queryFn: () => api.getCollectiblesByType(typeName),
    enabled: !!typeName,
  })
}