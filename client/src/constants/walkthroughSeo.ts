import seo from './seo.json';

// Optional hand-written head copy for a walkthrough category and its pages. The
// strings live in seo.json's walkthroughTypes, the single source shared with the
// server-side head injection (server/app/seo_head.py), which reads the same keys.
// A category or page without them keeps the generated "… Walkthrough(s)" copy.
export type WalkthroughPageSeo = { title: string; description: string };
export type WalkthroughTypeSeo = {
  name: string;
  image: string;
  title?: string;
  description?: string;
  intro?: string;
  pages?: Record<string, WalkthroughPageSeo>;
};

const TYPES: Record<string, WalkthroughTypeSeo> = seo.walkthroughTypes;

// URL segments index these maps, so prototype keys such as `constructor` must miss.
export function walkthroughTypeSeo(type: string): WalkthroughTypeSeo | undefined {
  return Object.hasOwn(TYPES, type) ? TYPES[type] : undefined;
}

export function walkthroughPageSeo(type: string, slug: string): WalkthroughPageSeo | undefined {
  const pages = walkthroughTypeSeo(type)?.pages;
  return pages && Object.hasOwn(pages, slug) ? pages[slug] : undefined;
}
