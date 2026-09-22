import { useQueryClient } from '@tanstack/react-query'
import { api, type LevelWithLocations, type LocationWithCollectibles, type Walkthrough } from '../services/api'
import { buildSlugMap } from '../utils/slugify'
import { buildSrcSet, gallerySizes } from '../utils/image'
import { loadedUrlCache } from '../utils/imageCache'

const ABOVE_FOLD_PREFETCH_COUNT = 3;
const WALKTHROUGH_ABOVE_FOLD_COUNT = 2;
const prefetchedImageUrls = new Set<string>();
// Held until each image settles so nothing can be collected mid-flight. The
// load handler is the only writer to loadedUrlCache.
const inFlightImages = new Set<HTMLImageElement>();

// Warms one image through a detached <img> carrying the gallery's own srcset
// and sizes, so the browser runs its real candidate selection against the live
// viewport and we never have to guess which file it will pick. Nothing is
// written to loadedUrlCache until the bytes have actually arrived — a
// speculative entry would make the destination gallery skip its loading state
// and show an empty box for the whole download.
function warmImage(url: string, sizes: string) {
  if (prefetchedImageUrls.has(url)) return;
  prefetchedImageUrls.add(url);

  const img = new Image();
  // sizes before srcset: assigning srcset is what queues candidate selection.
  img.sizes = sizes;
  // No src: when srcset carries w descriptors the spec ignores src for
  // selection, so srcset + sizes alone reproduces what ImageGallery's <img>
  // resolves to.
  img.srcset = buildSrcSet(url);

  const release = () => inFlightImages.delete(img);
  img.onload = () => {
    // currentSrc is the candidate the browser actually chose and finished
    // downloading — the same string ImageGallery records for its own loads,
    // and the only thing its seeding lookup can match.
    loadedUrlCache.add(img.currentSrc);
    release();
  };
  img.onerror = release;
  inFlightImages.add(img);
}

function prefetchImage(anchor: string | undefined, collectibles: { id: number; title: string; images: { url: string; alt: string }[] }[]) {
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
    if (!collectible.images.length) continue;
    const sizes = gallerySizes(collectible.images);
    for (const image of collectible.images) {
      warmImage(image.url, sizes);
    }
  }
}

function prefetchWalkthroughImages(walkthrough: Walkthrough) {
  let sectionCount = 0;
  for (const section of walkthrough.content) {
    if (sectionCount >= WALKTHROUGH_ABOVE_FOLD_COUNT) break;
    const sectionImages = section.images ?? [];
    if (!sectionImages.length) continue;
    const sizes = gallerySizes(sectionImages);
    for (const image of sectionImages) {
      warmImage(image.url, sizes);
    }
    sectionCount++;
  }
}

export function usePrefetch() {
  const queryClient = useQueryClient()

  // Query keys below must byte-match useCollectibles/useWalkthroughs — keys are
  // the cache identity, so drift means prefetch warms dead entries and hover
  // prefetching silently stops working.
  const prefetchLevel = async (levelName: string, anchor?: string) => {
    const queryKey = ['level-collectibles', levelName] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => api.getLevelCollectibles(levelName),
    })
    const data = queryClient.getQueryData<LocationWithCollectibles[]>(queryKey);
    prefetchImage(anchor, data?.flatMap(loc => loc.collectibles) ?? []);
  }

  const prefetchCollectiblesByType = async (typeName: string, category: string = 'collectibles', anchor?: string) => {
    const queryKey = ['type-collectibles', category, typeName] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => {
        if (category === 'upgrades') {
          return api.getUpgradesByType(typeName);
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
    prefetchCollectiblesByType,
    prefetchWalkthroughsByType,
    prefetchWalkthroughBySlug,
  }
}