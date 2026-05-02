import { useQueryClient } from '@tanstack/react-query'
import { api, type LevelWithLocations, type LocationWithCollectibles } from '../services/api'
import { buildSlugMap } from '../utils/slugify'
import { buildSrcSet, thumbnailUrl, predictRenderedWidth, SINGLE_SIZES, GRID_SIZES } from '../utils/cloudinary'
import { loadedUrlCache } from '../utils/imageCache'

const prefetchedImageUrls = new Set<string>();

function prefetchImage(anchor: string | undefined, collectibles: { id: number; title: string; images: { url: string }[] }[]) {
  if (!anchor) return;
  const slugMap = buildSlugMap(collectibles);
  const match = collectibles.find(c => slugMap.get(c.id) === anchor);
  if (!match) return;
  const imageCount = match.images.length;
  const predictedWidth = predictRenderedWidth(imageCount, window.innerWidth, window.devicePixelRatio);
  const sizes = imageCount === 1 ? SINGLE_SIZES : GRID_SIZES;
  for (const image of match.images) {
    if (prefetchedImageUrls.has(image.url)) continue;
    prefetchedImageUrls.add(image.url);
    const predictedUrl = thumbnailUrl(image.url, predictedWidth);
    loadedUrlCache.add(predictedUrl);
    new Image().src = predictedUrl;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.imageSrcset = buildSrcSet(image.url);
    link.imageSizes = sizes;
    document.head.appendChild(link);
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