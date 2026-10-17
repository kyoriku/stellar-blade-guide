import { describe, it, expect } from 'vitest'
import {
  BULK_DONE_KEY,
  HAND_CLEAR_THRESHOLD,
  HAND_CLEAR_WINDOW_MS,
  TIP_SHOWN_KEY,
  claimTip,
  createUntickWindow,
  markBulkDone,
  noteToggle,
  type TipStorage,
  type UntickWindow,
} from './handClearTip'

// Vitest runs in Node, which has no localStorage, so a Map stands in for it, and
// each way a browser's storage can fail gets a stand-in of its own.
function memoryStorage(seed: Record<string, string> = {}) {
  const items = new Map(Object.entries(seed))
  const storage: TipStorage = {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => { items.set(key, value) },
  }
  return { storage, items }
}

const refused = (): never => {
  throw new DOMException('Access is denied for this document.', 'SecurityError')
}
const full = (): never => {
  throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
}

const LEVEL = 'level:Eidos 7'
const T0 = 1_000_000

// Unticks ids from..from+n-1 in one scope, a second apart, and returns each answer.
function untick(
  w: UntickWindow,
  n: number,
  { scope = LEVEL, start = T0, from = 1 }: { scope?: string; start?: number; from?: number } = {},
): boolean[] {
  return Array.from({ length: n }, (_, i) => noteToggle(w, scope, from + i, false, start + i * 1000))
}

describe('noteToggle', () => {
  it('fires on the tenth different item unticked, and not before', () => {
    expect(HAND_CLEAR_THRESHOLD).toBe(10)
    const answers = untick(createUntickWindow(), 10)
    expect(answers).toEqual([...Array<boolean>(9).fill(false), true])
  })

  it('counts unticks up to two minutes old, the boundary included', () => {
    expect(HAND_CLEAR_WINDOW_MS).toBe(120_000)
    const w = createUntickWindow()
    untick(w, 9)
    expect(noteToggle(w, LEVEL, 99, false, T0 + HAND_CLEAR_WINDOW_MS)).toBe(true)
  })

  it('drops unticks older than two minutes', () => {
    const w = createUntickWindow()
    untick(w, 9)
    // The first untick is now a millisecond past the window, leaving nine.
    expect(noteToggle(w, LEVEL, 99, false, T0 + HAND_CLEAR_WINDOW_MS + 1)).toBe(false)
  })

  it('never counts ticks', () => {
    const w = createUntickWindow()
    const answers = Array.from({ length: 20 }, (_, i) => noteToggle(w, LEVEL, i + 1, true, T0 + i))
    expect(answers.some(Boolean)).toBe(false)
  })

  it('takes a re-ticked item back out of the count', () => {
    const w = createUntickWindow()
    untick(w, 9)
    expect(noteToggle(w, LEVEL, 5, true, T0 + 9_000)).toBe(false)
    expect(noteToggle(w, LEVEL, 50, false, T0 + 10_000)).toBe(false)
    expect(noteToggle(w, LEVEL, 51, false, T0 + 11_000)).toBe(true)
  })

  it('counts an item unticked twice once', () => {
    const w = createUntickWindow()
    untick(w, 9)
    expect(noteToggle(w, LEVEL, 3, false, T0 + 9_000)).toBe(false)
  })

  it('starts over in another scope', () => {
    const w = createUntickWindow()
    untick(w, 9)
    expect(noteToggle(w, 'type:documents', 100, false, T0 + 9_000)).toBe(false)
    expect(untick(w, 9, { scope: 'type:documents', start: T0 + 10_000, from: 101 }).at(-1)).toBe(true)
  })

  it('tries once per tab: after firing it counts nothing more', () => {
    const w = createUntickWindow()
    untick(w, 10)
    expect(untick(w, 20, { start: T0 + 20_000, from: 200 }).some(Boolean)).toBe(false)
  })
})

describe('claimTip', () => {
  it('lets the tip show once, writing its flag first', () => {
    const { storage, items } = memoryStorage()
    expect(claimTip(() => storage)).toBe(true)
    expect(items.get(TIP_SHOWN_KEY)).toBe('1')
    expect(claimTip(() => storage)).toBe(false)
  })

  it('refuses in a browser that has completed a bulk action, and writes nothing', () => {
    const { storage, items } = memoryStorage({ [BULK_DONE_KEY]: '1' })
    expect(claimTip(() => storage)).toBe(false)
    expect(items.has(TIP_SHOWN_KEY)).toBe(false)
  })

  it('fails closed when storage cannot be reached, read, written or read back', () => {
    expect(claimTip(refused)).toBe(false)
    expect(claimTip(() => ({ getItem: refused, setItem: () => {} }))).toBe(false)
    expect(claimTip(() => ({ getItem: () => null, setItem: full }))).toBe(false)
    // A write that never sticks.
    expect(claimTip(() => ({ getItem: () => null, setItem: () => {} }))).toBe(false)
  })
})

describe('markBulkDone', () => {
  it('records the bulk action, which keeps the tip away from then on', () => {
    const { storage, items } = memoryStorage()
    markBulkDone(() => storage)
    expect(items.get(BULK_DONE_KEY)).toBe('1')
    expect(claimTip(() => storage)).toBe(false)
  })

  it('never throws, whatever storage does', () => {
    expect(() => markBulkDone(refused)).not.toThrow()
    expect(() => markBulkDone(() => ({ getItem: () => null, setItem: full }))).not.toThrow()
  })
})
