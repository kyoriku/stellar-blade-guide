export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9\u0370-\u03ff]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Suffix assignment (-1, -2, \u2026) is positional: collectibles that share a base
// slug are numbered in array iteration order. Callers must pass them in the
// same order used when generating the anchors (i.e. server-returned order).
export function buildSlugMap(
  collectibles: { id: number; title: string }[],
): Map<number, string> {
  const slugCounts: Record<string, number> = {};
  for (const c of collectibles) {
    const base = slugifyTitle(c.title);
    slugCounts[base] = (slugCounts[base] || 0) + 1;
  }
  const slugUsed: Record<string, number> = {};
  const map = new Map<number, string>();
  for (const c of collectibles) {
    const base = slugifyTitle(c.title);
    if (slugCounts[base] > 1) {
      slugUsed[base] = (slugUsed[base] || 0) + 1;
      map.set(c.id, `${base}-${slugUsed[base]}`);
    } else {
      map.set(c.id, base);
    }
  }
  return map;
}
