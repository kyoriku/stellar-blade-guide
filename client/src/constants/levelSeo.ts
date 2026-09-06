import { LEVELS, type LevelSlug } from './navigation';
import seo from './seo.json';

export function isLevelSlug(value: string): value is LevelSlug {
  return LEVELS.some(level => level.slug === value);
}

// Hand-written copy; counts are hardcoded to the seeded dataset. The strings
// live in seo.json — the single source shared with the server-side head
// injection (server/app/seo_head.py). The Record annotation keeps the
// every-slug-present compile guarantee; the e2e count-consistency spec
// (e2e/specs/level-seo.spec.ts) pins each title's number to the live count
// line, so a data correction must update both together.
export const LEVEL_SEO: Record<LevelSlug, { title: string; description: string }> = seo.levels;
