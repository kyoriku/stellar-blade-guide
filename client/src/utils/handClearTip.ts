// The one-time tip for someone clearing their progress one checkmark at a time: it
// points them at Manage progress, which clears a whole level or type at once. Pure
// logic, with storage and the clock passed in; hooks/useHandClearTip.ts wires it to
// the toast and the router.

// Ten different items unticked within two minutes. A hand-clear runs far past both
// (one reset took 128 unticks in five minutes), and fixing a few mistakes never
// gets near them.
export const HAND_CLEAR_THRESHOLD = 10
export const HAND_CLEAR_WINDOW_MS = 2 * 60 * 1000

// Written before the tip shows, so it shows once per browser whether or not it is
// clicked.
export const TIP_SHOWN_KEY = 'sb_tip_hand_clear'
// Written when a bulk write succeeds: a browser that has used the tool never needs
// the tip.
export const BULK_DONE_KEY = 'sb_bulk_done'

export interface TipStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

// The unticks counted in one scope, each id with when it was last unticked.
export interface UntickWindow {
  scope: string | null
  unticks: Map<number, number>
  done: boolean
}

export function createUntickWindow(): UntickWindow {
  return { scope: null, unticks: new Map(), done: false }
}

/**
 * Notes one signed-in click on a level or type page (`found` is the click's
 * intent) and says whether it is the untick that crosses the threshold. Counted
 * per scope, the one the tip names: a new scope starts over, a re-tick takes its
 * item back out, and unticking one item twice counts it once. A tab tries once:
 * after crossing, it counts nothing more, whether or not the tip could show.
 */
export function noteToggle(w: UntickWindow, scope: string, id: number, found: boolean, now: number): boolean {
  if (w.done) return false
  if (w.scope !== scope) {
    w.scope = scope
    w.unticks.clear()
  }
  if (found) {
    w.unticks.delete(id)
    return false
  }
  w.unticks.set(id, now)
  for (const [key, at] of w.unticks) {
    if (now - at > HAND_CLEAR_WINDOW_MS) w.unticks.delete(key)
  }
  if (w.unticks.size < HAND_CLEAR_THRESHOLD) return false
  w.done = true
  return true
}

/**
 * Whether the tip may show now, recording that it has. Fails closed: storage that
 * cannot be read, written, or read back means no tip. The storage is a getter
 * because a browser that refuses site storage throws from `window.localStorage`
 * itself.
 */
export function claimTip(storage: () => TipStorage): boolean {
  try {
    const s = storage()
    if (s.getItem(BULK_DONE_KEY) !== null || s.getItem(TIP_SHOWN_KEY) !== null) return false
    s.setItem(TIP_SHOWN_KEY, '1')
    return s.getItem(TIP_SHOWN_KEY) === '1'
  } catch {
    return false
  }
}

/** Records a completed bulk action. Never throws: it runs inside the write's success. */
export function markBulkDone(storage: () => TipStorage): void {
  try {
    storage().setItem(BULK_DONE_KEY, '1')
  } catch {
    // A lost flag at worst lets the tip show once, which beats turning a
    // committed write into an error.
  }
}
