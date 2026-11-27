import { readItem, removeItem, storageProblem, writeItem, type StorageLike } from './storage'

// A signed-out reader's checkmarks: what sb_progress holds, with each change the browser
// won't store kept in the tab's memory instead (hooks/useProgress.ts holds it).

export const STORAGE_KEY = 'sb_progress'

export interface GuestMemory {
  // Each change storage hasn't taken, by id: true for found.
  unsaved: Map<number, boolean>
}

export function createGuestMemory(): GuestMemory {
  return { unsaved: new Map() }
}

type Store = () => StorageLike | null

// What storage holds, or null when it refuses the read. Anything but an id array reads as
// nothing, so the next write replaces it.
function readStored(store?: Store): Set<number> | null {
  const raw = readItem(STORAGE_KEY, store)
  if (raw === null) return storageProblem(store) ? null : new Set()
  try {
    const ids: unknown = JSON.parse(raw)
    return Array.isArray(ids) && ids.every(Number.isInteger) ? new Set(ids as number[]) : new Set()
  } catch {
    return new Set()
  }
}

function withChanges(stored: Set<number> | null, unsaved: Map<number, boolean>): Set<number> {
  const ids = new Set(stored)
  for (const [id, found] of unsaved) {
    if (found) ids.add(id)
    else ids.delete(id)
  }
  return ids
}

/** What a signed-out reader sees: what storage holds, with the tab's unsaved changes. */
export function guestIds(memory: GuestMemory, store?: Store): Set<number> {
  return withChanges(readStored(store), memory.unsaved)
}

/**
 * Marks one item found or not, applied to what storage holds now. A change storage won't
 * take stays in memory until a write lands with it, and storage that can't be read is
 * never written, since the write would replace whatever it holds.
 */
export function markGuest(
  memory: GuestMemory,
  id: number,
  found: boolean,
  store?: Store,
): { ids: Set<number> } {
  const stored = readStored(store)
  memory.unsaved.set(id, found)
  const ids = withChanges(stored, memory.unsaved)
  if (stored !== null && writeItem(STORAGE_KEY, JSON.stringify([...ids]), store)) memory.unsaved.clear()
  return { ids }
}

/**
 * Takes ids out of the guest copy, stored or unsaved: what a sign-in sync sent, or a bulk
 * clear's scope. Writes nothing when no value is stored and nothing is unsaved.
 */
export function dropGuestIds(memory: GuestMemory, ids: number[], store?: Store): void {
  if (!readItem(STORAGE_KEY, store) && memory.unsaved.size === 0) return
  const stored = readStored(store)
  for (const id of ids) memory.unsaved.set(id, false)
  if (stored === null) return
  const kept = withChanges(stored, memory.unsaved)
  if (kept.size === 0) {
    removeItem(STORAGE_KEY, store)
    // A removal that didn't take keeps the drop, as a refused write does.
    if (readItem(STORAGE_KEY, store) !== null) return
  } else if (!writeItem(STORAGE_KEY, JSON.stringify([...kept]), store)) return
  memory.unsaved.clear()
}
