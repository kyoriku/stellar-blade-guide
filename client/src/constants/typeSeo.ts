import { COLLECTIBLES, UPGRADES, COSMETICS, MATERIALS } from './navigation';
import type { CollectibleSlug, UpgradeSlug, CosmeticSlug, MaterialSlug } from './navigation';
import seo from './seo.json';

export type TypeSlug = CollectibleSlug | UpgradeSlug | CosmeticSlug | MaterialSlug;

export function isTypeSlug(value: string): value is TypeSlug {
  return (
    COLLECTIBLES.some(t => t.slug === value) ||
    UPGRADES.some(t => t.slug === value) ||
    COSMETICS.some(t => t.slug === value) ||
    MATERIALS.some(t => t.slug === value)
  );
}

// Static head-tag copy; counts are hardcoded to the seeded dataset (same
// policy as levelSeo.ts). The strings live in seo.json — the single source
// shared with the server-side head injection (server/app/seo_head.py), keyed
// per category there so cross-category URLs keep 404ing. The four annotated
// consts preserve both the every-slug-present and the correct-category
// compile guarantees. The e2e count-consistency spec
// (e2e/specs/type-seo.spec.ts) pins each title's number to the live count
// line, so a data correction must update both together.
type PageSeo = { title: string; description: string };
const collectibles: Record<CollectibleSlug, PageSeo> = seo.types.collectibles;
const upgrades: Record<UpgradeSlug, PageSeo> = seo.types.upgrades;
const cosmetics: Record<CosmeticSlug, PageSeo> = seo.types.cosmetics;
const materials: Record<MaterialSlug, PageSeo> = seo.types.materials;

export const TYPE_SEO: Record<TypeSlug, PageSeo> = {
  ...collectibles,
  ...upgrades,
  ...cosmetics,
  ...materials,
};
