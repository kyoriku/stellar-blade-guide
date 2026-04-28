import { useQueryClient } from '@tanstack/react-query'
import { api, type LevelWithLocations, type LocationWithCollectibles } from '../services/api'
import { loadedUrlCache } from '../utils/imageCache'
import { buildSlugMap } from '../utils/slugify'
import { thumbnailUrl } from '../utils/cloudinary'

function prefetchImage(anchor: string | undefined, collectibles: { id: number; title: string; images: { url: string }[] }[]) {
  if (!anchor) return;
  const slugMap = buildSlugMap(collectibles);
  const match = collectibles.find(c => slugMap.get(c.id) === anchor);
  if (!match) return;
  for (const image of match.images) {
    const thumb = thumbnailUrl(image.url);
    if (!loadedUrlCache.has(thumb)) {
      loadedUrlCache.add(thumb);
      new Image().src = thumb;
    }
  }
}

export function usePrefetch() {
  const queryClient = useQueryClient()

  const prefetchLevel = async (levelName: string, anchor?: string) => {
    const queryKey = ['level-collectibles', levelName] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => api.getLevelCollectibles(levelName),
    })
    const data = queryClient.getQueryData<LocationWithCollectibles[]>(queryKey);
    prefetchImage(anchor, data?.flatMap(loc => loc.collectibles) ?? []);
  }

  const prefetchLocations = (levelName: string) => {
    void queryClient.prefetchQuery({
      queryKey: ['locations', levelName],
      queryFn: () => api.getLocations(levelName),
    })
  }

  const prefetchCollectiblesByType = async (typeName: string, category: string = 'collectibles', anchor?: string) => {
    const queryKey = ['type-collectibles', category, typeName] as const;
    await queryClient.prefetchQuery({
      queryKey,
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
    })
    const data = queryClient.getQueryData<LevelWithLocations[]>(queryKey);
    prefetchImage(anchor, data?.flatMap(level => level.locations.flatMap(loc => loc.collectibles)) ?? []);
  }

  const prefetchWalkthroughsByType = (type: string) => {
    void queryClient.prefetchQuery({
      queryKey: ['walkthroughs', 'type', type],
      queryFn: () => api.getWalkthroughsByType(type),
    })
  }

  const prefetchWalkthroughBySlug = (type: string, slug: string) => {
    void queryClient.prefetchQuery({
      queryKey: ['walkthrough', type, slug],
      queryFn: () => api.getWalkthroughBySlug(type, slug),
    })
  }

  return {
    prefetchLevel,
    prefetchLocations,
    prefetchCollectiblesByType,
    prefetchWalkthroughsByType,
    prefetchWalkthroughBySlug,
  }
}