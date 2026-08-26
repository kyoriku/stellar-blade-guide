import { LEVELS } from '../constants/navigation'
import type { TypeStat, LevelStat, CycleStat } from '../services/api'

// Pure row-building logic for the My Progress page (extracted from
// ProgressPage.tsx so it can be unit-tested; the page owns all rendering).
// The page chrome is fully static — row membership, order, and labels come
// from the nav constants — and only the value slots wait for data, so data
// arrival fills the same rows in place with zero reflow.

export interface Stat {
  completed: number
  total: number
}

export interface Row {
  key: string
  label: string
  slug: string | null
  stat: Stat | null // null while data is loading
}

// Floor, not round: 100% must mean true completion (one short of the total
// must still read 99%).
export const pct = (completed: number, total: number) =>
  total > 0 ? Math.floor((completed / total) * 100) : 0

// Type rows use navbar order and navbar (plural) labels, not the server's
// display_order/singular names — the navbar is what users already know.
// Server types the nav constants don't know are appended, not dropped; nav
// types absent from a loaded response drop out.
export function typeRows(
  types: TypeStat[] | undefined,
  category: string,
  nav: readonly { slug: string; name: string }[],
): Row[] {
  if (!types) return nav.map(n => ({ key: n.slug, label: n.name, slug: n.slug, stat: null }))
  const inCategory = types.filter(t => t.category === category)
  const bySlug = new Map(inCategory.map(t => [t.slug, t]))
  const known = nav.flatMap(n => {
    const t = bySlug.get(n.slug)
    return t ? [{ key: n.slug, label: n.name, slug: n.slug, stat: t }] : []
  })
  const extras = inCategory
    .filter(t => !nav.some(n => n.slug === t.slug))
    .map(t => ({ key: t.slug, label: t.name, slug: t.slug, stat: t }))
  return [...known, ...extras]
}

// By Level lists only the 10 real, navigable levels (the navbar list). The
// server's levels array also carries two buckets that aren't levels at all —
// 'Default' (level-less starting/bonus gear; the label the type pages already
// show) and 'Boss Challenge' (a game mode) — those render in their own
// "Other Sources" section. Together the two sections partition the catalog.
export const LEVEL_ROWS_STATIC: { key: string; label: string; slug: string | null }[] =
  LEVELS.map(l => ({ key: l.name, label: l.name, slug: l.slug }))

export const NON_LEVEL_ROWS_STATIC: { key: string; label: string; slug: string | null }[] = [
  { key: 'Default', label: 'Default', slug: null },
  { key: 'Boss Challenge', label: 'Boss Challenge', slug: null },
]

export function levelRows(levels: LevelStat[] | undefined): Row[] {
  if (!levels) return LEVEL_ROWS_STATIC.map(r => ({ ...r, stat: null }))
  const byName = new Map(levels.map(l => [l.name, l]))
  const known = LEVEL_ROWS_STATIC.flatMap(r => {
    const s = byName.get(r.key)
    return s ? [{ ...r, stat: s }] : []
  })
  // Unknown names are presumed genuine new levels (a real one would get a nav
  // entry in the same release) — appended here, not to the non-level section.
  const extras = levels
    .filter(l =>
      !LEVEL_ROWS_STATIC.some(r => r.key === l.name) &&
      !NON_LEVEL_ROWS_STATIC.some(r => r.key === l.name)
    )
    .map(l => ({ key: l.name, label: l.name, slug: null, stat: l }))
  return [...known, ...extras]
}

export function nonLevelRows(levels: LevelStat[] | undefined): Row[] {
  if (!levels) return NON_LEVEL_ROWS_STATIC.map(r => ({ ...r, stat: null }))
  const byName = new Map(levels.map(l => [l.name, l]))
  return NON_LEVEL_ROWS_STATIC.flatMap(r => {
    const s = byName.get(r.key)
    return s ? [{ ...r, stat: s }] : []
  })
}

// Fixed cycle order, matching the detail pages' cycle ordering and the
// server's own ranking; cycles absent from the response drop out.
export const CYCLE_NAMES = ['Base', 'NG+', 'NG++', 'DLC']

export function cycleRows(cycles: CycleStat[] | undefined): Row[] {
  if (!cycles) return CYCLE_NAMES.map(name => ({ key: name, label: name, slug: null, stat: null }))
  const byName = new Map(cycles.map(c => [c.name, c]))
  const known = CYCLE_NAMES.flatMap(name => {
    const c = byName.get(name)
    return c ? [{ key: name, label: name, slug: null, stat: c }] : []
  })
  const extras = cycles
    .filter(c => !CYCLE_NAMES.includes(c.name))
    .map(c => ({ key: c.name, label: c.name, slug: null, stat: c }))
  return [...known, ...extras]
}
