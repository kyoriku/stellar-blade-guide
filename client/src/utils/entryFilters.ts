// Each history entry keeps the filters its level or type page showed, in the entry's state
// under React Router's `usr` (what useLocation().state reads), so Back, Forward and a reload
// put them back. An entry with no record shows the default view, which is never written.

export type SortMode = 'default' | 'alphabetical'

export interface PageFilters {
  cycle: string
  subtype: string
  sort: SortMode
}

export const DEFAULT_FILTERS: PageFilters = { cycle: 'All', subtype: 'All', sort: 'default' }

const KEY = 'sbFilters'

type Obj = Record<string, unknown>
const isObject = (value: unknown): value is Obj => typeof value === 'object' && value !== null

export function sameFilters(a: PageFilters, b: PageFilters): boolean {
  return a.cycle === b.cycle && a.subtype === b.subtype && a.sort === b.sort
}

// The filters `state` (a location's state, or an entry's `usr`) holds for the page at `path`,
// or the defaults.
export function readFilters(state: unknown, path: string): PageFilters {
  const record = isObject(state) ? state[KEY] : undefined
  if (!isObject(record) || record.v !== 1 || record.path !== path) return DEFAULT_FILTERS
  return {
    cycle: typeof record.cycle === 'string' ? record.cycle : 'All',
    subtype: typeof record.subtype === 'string' ? record.subtype : 'All',
    sort: record.sort === 'alphabetical' ? 'alphabetical' : 'default',
  }
}

export interface HistoryLike {
  readonly state: unknown
  replaceState(data: unknown, unused: string): void
}

// Writes `view` to the browser's current entry (no record for the default view), keeping the
// rest of its state. Skips when the browser has moved on from `entry` or nothing changes
// (Safari caps history calls, the router's included). Never throws.
export function rememberFilters(
  history: HistoryLike,
  entry: { key: string; pathname: string },
  browserPath: string,
  view: PageFilters,
): void {
  try {
    const state = isObject(history.state) ? history.state : null
    const key = typeof state?.key === 'string' ? state.key : 'default'
    if (key !== entry.key || browserPath !== entry.pathname) return
    const usr = isObject(state?.usr) ? state.usr : {}
    if (sameFilters(readFilters(usr, entry.pathname), view)) return
    const rest = Object.fromEntries(Object.entries(usr).filter(([k]) => k !== KEY))
    const next = sameFilters(view, DEFAULT_FILTERS) ? rest : { ...rest, [KEY]: { v: 1, path: entry.pathname, ...view } }
    history.replaceState({ ...state, usr: Object.keys(next).length > 0 ? next : null }, '')
  } catch {
    // A refused history call leaves the entry as it was.
  }
}

// What a loaded page can show of `view`: a cycle among `cycles` (none when it shows no cycle
// pills) and a subtype among `subtypes` (null when it shows no subtype select), else All.
// Returns `view` itself when it can show all of it.
export function offeredFilters(view: PageFilters, cycles: readonly string[], subtypes: readonly string[] | null): PageFilters {
  const cycle = view.cycle === 'All' || cycles.includes(view.cycle) ? view.cycle : 'All'
  const subtype = view.subtype === 'All' || (subtypes?.includes(view.subtype) ?? false) ? view.subtype : 'All'
  return cycle === view.cycle && subtype === view.subtype ? view : { ...view, cycle, subtype }
}
