// What each stored cycle is called on screen; every display of a cycle reads it.
// Display only: the database, the API and every request keep the stored value.
// Temporary (CLAUDE.md, Cycle labels): a later migration renames "Base" itself and
// removes this map. Imports nothing, so e2e specs can load it.
export const CYCLE_LABELS: Readonly<Record<string, string>> = { Base: 'NG' }

// Anything without an entry (NG+, a cycle the client does not know, "All") shows as is.
export const cycleLabel = (cycle: string): string => CYCLE_LABELS[cycle] ?? cycle
