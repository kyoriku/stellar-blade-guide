import { useQueryClient } from '@tanstack/react-query'
import { api, type LevelWithLocations, type LocationWithCollectibles, type Walkthrough } from '../services/api'
import { buildSlugMap } from '../utils/slugify'
import { buildSrcSet, thumbnailUrl, predictRenderedWidth, SINGLE_SIZES, GRID_SIZES } from '../utils/cloudinary'
import { loadedUrlCache } from '../utils/imageCache'

const ABOVE_FOLD_PREFETCH_COUNT = 3;
const WALKTHROUGH_ABOVE_FOLD_COUNT = 2;
const prefetchedImageUrls = new Set<string>();

function prefetchImage(anchor: string | undefined, collectibles: { id: number; title: string; images: { url: string }[] }[]) {
  let targets: typeof collectibles;
  if (anchor) {
    const slugMap = buildSlugMap(collectibles);
    const match = collectibles.find(c => slugMap.get(c.id) === anchor);
    if (!match) return;
    targets = [match];
  } else {
    targets = collectibles.slice(0, ABOVE_FOLD_PREFETCH_COUNT);
  }

  for (const collectible of targets) {
    const imageCount = collectible.images.length;
    if (!imageCount) continue;
    const predictedWidth = predictRenderedWidth(imageCount, window.innerWidth, window.devicePixelRatio);
    const sizes = imageCount === 1 ? SINGLE_SIZES : GRID_SIZES;
    for (const image of collectible.images) {
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
}

function prefetchWalkthroughImages(walkthrough: Walkthrough) {
  let sectionCount = 0;
  for (const section of walkthrough.content) {
    if (sectionCount >= WALKTHROUGH_ABOVE_FOLD_COUNT) break;
    const sectionImages = section.images ?? [];
    if (!sectionImages.length) continue;
    const imageCount = sectionImages.length;
    const predictedWidth = predictRenderedWidth(imageCount, window.innerWidth, window.devicePixelRatio);
    const sizes = imageCount === 1 ? SINGLE_SIZES : GRID_SIZES;
    for (const image of sectionImages) {
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
    sectionCount++;
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

  const prefetchWalkthroughBySlug = async (type: string, slug: string) => {
    const queryKey = ['walkthrough', type, slug] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => api.getWalkthroughBySlug(type, slug),
    })
    const data = queryClient.getQueryData<Walkthrough>(queryKey);
    if (data) prefetchWalkthroughImages(data);
  }

  return {
    prefetchLevel,
    prefetchLocations,
    prefetchCollectiblesByType,
    prefetchWalkthroughsByType,
    prefetchWalkthroughBySlug,
  }
}