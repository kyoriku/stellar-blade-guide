// The five site sections' names: each index page's h1 and navbar label, and the
// parent crumb of every page under it, so a breadcrumb names the page it points at.
export const SECTION_LABELS = {
  walkthroughs: 'Walkthroughs',
  levels: 'Levels',
  collectibles: 'Collectibles',
  upgrades: 'Upgrades',
  cosmetics: 'Cosmetics',
} as const;

export type SectionKey = keyof typeof SECTION_LABELS;
