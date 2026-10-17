import { COLLECTIBLES, UPGRADES, COSMETICS } from '../constants/navigation'
import { BULK_COPY } from '../constants/bulkProgressCopy'
import type { Scope } from '../constants/bulkProgressCopy'
import { cycleLabel } from '../constants/cycleLabels'
import { CYCLE_NAMES, levelRows, nonLevelRows, typeRows } from './progressRows'
import { ApiError, errorMessage } from '../services/api'
import type { BulkAction, BulkCycle, BulkProgressRequest, BulkTarget, CycleStat, LevelStat, TypeStat } from '../services/api'

// Pure logic for the Progress page's Manage progress card (rendering lives in
// components/BulkProgressSection.tsx). Scope options are the exact rows the page
// itself lists, in its card order, so the picker never offers a level or type the
// page does not show.

const EVERYTHING = 'everything'

export interface ScopeOption {
  value: string // 'everything', 'level:<exact name>' or 'type:<slug>'
  label: string
}

export interface ScopeGroup {
  label: string | null // null: options sit outside any optgroup
  options: ScopeOption[]
}

const TYPE_GROUPS = [
  { key: 'collectibles', label: BULK_COPY.groupCollectibles, nav: COLLECTIBLES },
  { key: 'upgrades', label: BULK_COPY.groupUpgrades, nav: UPGRADES },
  { key: 'cosmetics', label: BULK_COPY.groupCosmetics, nav: COSMETICS },
] as const

export function scopeGroups(stats?: { levels: LevelStat[]; types: TypeStat[] }): ScopeGroup[] {
  return [
    { label: null, options: [{ value: EVERYTHING, label: BULK_COPY.scopeEverything }] },
    {
      label: BULK_COPY.groupLevels,
      options: levelRows(stats?.levels).map(r => ({ value: `level:${r.key}`, label: r.label })),
    },
    ...TYPE_GROUPS.map(g => ({
      label: g.label,
      options: typeRows(stats?.types, g.key, g.nav).map(r => ({ value: `type:${r.key}`, label: r.label })),
    })),
    {
      label: BULK_COPY.groupOtherSources,
      options: nonLevelRows(stats?.levels).map(r => ({ value: `level:${r.key}`, label: r.label })),
    },
  ]
}

export function targetFromValue(value: string): BulkTarget | null {
  if (value === EVERYTHING) return { scope: 'everything' }
  const split = value.indexOf(':')
  if (split < 1) return null
  const kind = value.slice(0, split)
  const target = value.slice(split + 1)
  if (!target) return null
  if (kind === 'level') return { scope: 'level', level: target }
  if (kind === 'type') return { scope: 'type', type: target }
  return null
}

type CycleStats = { levels: LevelStat[]; types: TypeStat[]; cycles: CycleStat[] }

// The cycles a scope holds, from the stats rows. null when nothing is known: no
// scope chosen yet, or stats not loaded, where the server's empty-scope answer is
// the fallback.
function heldCycles(scopeValue: string, stats?: CycleStats): string[] | null {
  const target = targetFromValue(scopeValue)
  if (!stats || !target) return null
  if (target.scope === 'everything') return stats.cycles.filter(c => c.total > 0).map(c => c.name)
  const row = target.scope === 'level'
    ? stats.levels.find(l => l.name === target.level)
    : stats.types.find(t => t.slug === target.type)
  return row?.cycles ?? []
}

// The cycles a pill can narrow this scope to: the ones it holds, when it holds
// more than one, since picking a scope's only cycle narrows nothing. null when
// nothing is known to narrow by.
export function pickableCycles(scopeValue: string, stats?: CycleStats): ReadonlySet<string> | null {
  const held = heldCycles(scopeValue, stats)
  return held === null ? null : new Set(held.length > 1 ? held : [])
}

// A scope's only cycle, which the picker shows selected with every pill locked.
// Only shown: the request still names no cycle, as the scope is that cycle
// already, and the copy would just gain a redundant "(Base)". Only a cycle with a
// pill: a value the client does not know yet would lock the row on nothing.
export function soleCycle(scopeValue: string, stats?: CycleStats): string | null {
  const held = heldCycles(scopeValue, stats)
  return held?.length === 1 && CYCLE_NAMES.includes(held[0]) ? held[0] : null
}

// Whether the picker still offers a scope. One chosen from the static rows before
// stats load can be missing from the loaded rows (a level or type the catalog
// lost), and a select whose value matches no option shows its first one instead.
export function scopeOffered(scopeValue: string, groups: ScopeGroup[]): boolean {
  return groups.some(g => g.options.some(o => o.value === scopeValue))
}

// No cycle key at all for "all cycles": the server refuses an explicit null.
export function buildRequest(action: BulkAction, scopeValue: string, cycle: BulkCycle | ''): BulkProgressRequest | null {
  const target = targetFromValue(scopeValue)
  if (!target) return null
  return cycle ? { ...target, action, cycle } : { ...target, action }
}

// What the copy needs to name a scope in a sentence.
export function scopeForCopy(scopeValue: string, groups: ScopeGroup[], cycle: BulkCycle | ''): Scope {
  const option = groups.flatMap(g => g.options).find(o => o.value === scopeValue)
  return {
    label: option?.label ?? scopeValue,
    everything: scopeValue === EVERYTHING,
    // The copy names the cycle as the pills do; the request keeps the stored value.
    ...(cycle ? { cycle: cycleLabel(cycle) } : {}),
  }
}

// Trimmed and case-insensitive: phone keyboards capitalise the first letter.
export function confirmWordMatches(input: string, word: string): boolean {
  return input.trim().toLowerCase() === word.toLowerCase()
}

// Thrown before anything is sent, when this device's sign-in sync has not settled
// in time: going ahead could let the sync land after a clear and undo it.
export class GuestSyncPendingError extends Error {}

// A request the server refused outright (any 4xx; the rate limiter answers before
// the handler runs): nothing was written. Anything else may have committed before
// the failure.
export function wasRefused(err: unknown): boolean {
  return err instanceof GuestSyncPendingError
    || (err instanceof ApiError && err.status >= 400 && err.status < 500)
}

export function bulkErrorMessage(err: unknown, step: 'preview' | 'apply'): string {
  const fallback = step === 'preview' ? BULK_COPY.previewError : BULK_COPY.applyError
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return step === 'preview' ? BULK_COPY.previewTimeout : BULK_COPY.applyTimeout
  }
  // The rate limit keeps its existing sentence.
  if (err instanceof ApiError && err.status === 429) return errorMessage(err, fallback)
  // The UI never builds a request the server would refuse, so a refusal's text
  // ("Unknown level", a validator message) is not for the page.
  if (wasRefused(err)) return fallback
  // Server error and offline keep their existing sentences.
  return errorMessage(err, fallback)
}
