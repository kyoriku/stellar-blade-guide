import seo from './seo.json';

// Image URLs live in seo.json — the single source shared with the server-side
// head injection (server/app/seo_head.py). These maps are derived views keyed
// by slug, feeding both the index-page card grids and the detail pages' og
// images. Full-size R2 URLs; thumbnailUrl()/ogImageUrl() derive width variants
// at render time.
// No prototype, so a slug from the address such as `constructor` finds nothing.
function imagesOf(section: Record<string, { image: string }>): Record<string, string> {
  const images = Object.create(null) as Record<string, string>;
  for (const [slug, entry] of Object.entries(section)) images[slug] = entry.image;
  return images;
}

export const WALKTHROUGH_IMAGES: Record<string, string> = imagesOf(seo.walkthroughTypes);
export const LEVEL_IMAGES: Record<string, string> = imagesOf(seo.levels);
export const COLLECTIBLE_IMAGES: Record<string, string> = imagesOf(seo.types.collectibles);
export const UPGRADE_IMAGES: Record<string, string> = imagesOf(seo.types.upgrades);
export const COSMETIC_IMAGES: Record<string, string> = imagesOf(seo.types.cosmetics);
