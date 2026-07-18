export const GALLERY_WIDTHS = [640, 960, 1200, 1600] as const;

// Pixel widths the gallery actually renders at each Tailwind breakpoint.
// Single: 1 image fills full gallery width. Grid: 2-col layout at sm+.
// Formula: container max-w − px-3 padding (24px) − sidebar at lg+ (288px) − article p-6 padding (48px below md: 24px).
export const SINGLE_SIZES =
  '(max-width: 639px) calc(100vw - 48px), ' +
  '(max-width: 767px) 592px, ' +
  '(max-width: 1023px) 696px, ' +
  '(max-width: 1279px) 664px, ' +
  '(max-width: 1535px) 920px, ' +
  '1176px';

export const GRID_SIZES =
  '(max-width: 639px) calc(100vw - 48px), ' +
  '(max-width: 767px) 290px, ' +
  '(max-width: 1023px) 342px, ' +
  '(max-width: 1279px) 326px, ' +
  '(max-width: 1535px) 454px, ' +
  '582px';

const R2_BASE = 'https://img.stellarbladeguide.com/';

// R2 URLs get a -w{N} filename suffix (every size exists as its own object;
// no runtime transforms) — anything else passes through unchanged, silently
// collapsing buildSrcSet to one width.
export function thumbnailUrl(url: string, width = 1200): string {
  if (url.startsWith(R2_BASE) && url.endsWith('.webp')) {
    return `${url.slice(0, -'.webp'.length)}-w${width}.webp`;
  }
  return url;
}

// R2 has no named transforms; og consumers get the 1200-wide variant.
export function ogImageUrl(url: string): string {
  return thumbnailUrl(url, 1200);
}

export function buildSrcSet(url: string): string {
  return GALLERY_WIDTHS.map(w => `${thumbnailUrl(url, w)} ${w}w`).join(', ');
}

// Duplicates the px values in SINGLE_SIZES/GRID_SIZES — change those strings
// and this ladder together, or predictRenderedWidth mispredicts and the
// prefetch cache key misses.
function getCssWidth(imageCount: number, viewportWidth: number): number {
  if (imageCount === 0) return GALLERY_WIDTHS[0];
  if (viewportWidth < 640) return Math.max(1, viewportWidth - 48);
  if (imageCount === 1) {
    if (viewportWidth < 768) return 592;
    if (viewportWidth < 1024) return 696;
    if (viewportWidth < 1280) return 664;
    if (viewportWidth < 1536) return 920;
    return 1176;
  }
  if (viewportWidth < 768) return 290;
  if (viewportWidth < 1024) return 342;
  if (viewportWidth < 1280) return 326;
  if (viewportWidth < 1536) return 454;
  return 582;
}

export function predictRenderedWidth(imageCount: number, viewportWidth: number, dpr: number): number {
  const needed = getCssWidth(imageCount, viewportWidth) * dpr;
  return GALLERY_WIDTHS.find(w => w >= needed) ?? GALLERY_WIDTHS[GALLERY_WIDTHS.length - 1];
}
