import { describe, it, expect } from 'vitest'
import { createGuestMemory, dropGuestIds, guestIds, markGuest, STORAGE_KEY } from './guestProgress'
import type { StorageLike } from './storage'

// Node has no window, so a Map stands in for storage, with a stand-in for each way a
// browser's storage can refuse, as in storage.test.ts.
function memoryStore(stored?: number[] | string) {
  const items = new Map<string, string>()
  if (stored !== undefined) items.set(STORAGE_KEY, typeof stored === 'string' ? stored : JSON.stringify(stored))
  const calls: string[] = []
  const store: StorageLike = {
    getItem: key => {
      calls.push(`get ${key}`)
      return items.get(key) ?? null
    },
    setItem: (key, value) => {
      calls.push(`set ${key}`)
      items.set(key, value)
    },
    removeItem: key => {
      calls.push(`remove ${key}`)
      items.delete(key)
    },
  }
  const saved = () => {
    const raw = items.get(STORAGE_KEY)
    return raw === undefined ? null : (JSON.parse(raw) as number[]).sort((a, b) => a - b)
  }
  return { store, items, calls, saved }
}

const securityError = () => new DOMException('Access is denied for this document.', 'SecurityError')
const quotaError = () => new DOMException('The quota has been exceeded.', 'QuotaExceededError')
const blocked = (): never => {
  throw securityError()
}
const none = () => null
const sorted = (ids: Set<number>) => [...ids].sort((a, b) => a - b)

describe('a working store', () => {
  it('stores each change and keeps nothing in memory', () => {
    const memory = createGuestMemory()
    const { store, saved } = memoryStore([1])
    expect(sorted(markGuest(memory, 2, true, () => store).ids)).toEqual([1, 2])
    expect(sorted(markGuest(memory, 1, false, () => store).ids)).toEqual([2])
    expect(saved()).toEqual([2])
    expect(memory.unsaved.size).toBe(0)
  })

  it('applies a change to what storage holds now, not to an older read', () => {
    const memory = createGuestMemory()
    const { store, items, saved } = memoryStore([1])
    expect(sorted(guestIds(memory, () => store))).toEqual([1])
    // What a sign-in sync in another tab does to this tab's storage.
    items.delete(STORAGE_KEY)
    expect(sorted(markGuest(memory, 2, true, () => store).ids)).toEqual([2])
    expect(saved()).toEqual([2])
  })

  it('replaces a stored value that is not an id array', () => {
    for (const corrupt of ['"12"', '{', '[1,"2"]']) {
      const memory = createGuestMemory()
      const { store, saved } = memoryStore(corrupt)
      expect(sorted(guestIds(memory, () => store))).toEqual([])
      markGuest(memory, 3, true, () => store)
      expect(saved()).toEqual([3])
    }
  })
})

describe('storage the browser refuses (the getter throws)', () => {
  it('keeps the changes for the tab, for every later read', () => {
    const memory = createGuestMemory()
    markGuest(memory, 1, true, blocked)
    markGuest(memory, 2, true, blocked)
    markGuest(memory, 2, false, blocked)
    // A page mounted afterwards reads them back.
    expect(sorted(guestIds(memory, blocked))).toEqual([1])
  })

  it('shares nothing between tabs', () => {
    const first = createGuestMemory()
    markGuest(first, 1, true, blocked)
    expect(sorted(guestIds(createGuestMemory(), blocked))).toEqual([])
  })

  it('shows every change the tab has made, not only the newest', () => {
    const memory = createGuestMemory()
    markGuest(memory, 1, true, blocked)
    expect(sorted(markGuest(memory, 2, true, blocked).ids)).toEqual([1, 2])
  })
})

describe('no storage at all (the getter returns null)', () => {
  it('keeps the changes for the tab', () => {
    const memory = createGuestMemory()
    markGuest(memory, 1, true, none)
    markGuest(memory, 2, true, none)
    expect(sorted(guestIds(memory, none))).toEqual([1, 2])
  })
})

describe('storage that refuses writes', () => {
  function fullStore(stored?: number[]) {
    const s = memoryStore(stored)
    s.store.setItem = key => {
      s.calls.push(`set ${key}`)
      throw quotaError()
    }
    return s
  }

  it("shows the stored checkmarks with the tab's changes, and leaves storage as it was", () => {
    const memory = createGuestMemory()
    const { store, saved } = fullStore([9])
    markGuest(memory, 1, true, () => store)
    markGuest(memory, 9, false, () => store)
    expect(sorted(guestIds(memory, () => store))).toEqual([1])
    expect(saved()).toEqual([9])
  })

  it("shows the tab's changes over what storage holds, as each change is made", () => {
    const memory = createGuestMemory()
    const { store } = fullStore([8, 9])
    markGuest(memory, 1, true, () => store)
    expect(sorted(markGuest(memory, 9, false, () => store).ids)).toEqual([1, 8])
  })
})

describe('storage whose reads throw', () => {
  // Storage that is there but can't be read, as when Firefox can't open the site's data.
  function unreadableStore(stored: number[]) {
    const s = memoryStore(stored)
    s.store.getItem = () => {
      throw securityError()
    }
    return s
  }

  it('never writes over what it could not read', () => {
    const memory = createGuestMemory()
    const { store, calls, items } = unreadableStore([9])
    markGuest(memory, 1, true, () => store)
    expect(calls.filter(c => c.startsWith('set'))).toEqual([])
    expect(items.get(STORAGE_KEY)).toBe('[9]')
  })
})

describe('storage that starts working again', () => {
  it('stores the next change with every unsaved one, over what it holds', () => {
    const memory = createGuestMemory()
    // Storage that recovers in the page (Firefox, once disk space is freed): while its
    // data can't be opened, reads and writes throw; checkmarks stored before stay put.
    const { store, saved } = memoryStore([5, 9])
    const { getItem, setItem } = store
    let opening = true
    store.getItem = key => {
      if (opening) throw quotaError()
      return getItem(key)
    }
    store.setItem = (key, value) => {
      if (opening) throw quotaError()
      setItem(key, value)
    }
    markGuest(memory, 1, true, () => store)
    markGuest(memory, 9, false, () => store)
    expect(saved()).toEqual([5, 9])
    opening = false
    expect(sorted(markGuest(memory, 2, true, () => store).ids)).toEqual([1, 2, 5])
    expect(saved()).toEqual([1, 2, 5])
    expect(memory.unsaved.size).toBe(0)
  })
})

describe('dropping ids (after a sign-in sync, or a bulk clear)', () => {
  it('removes them from storage, and the key when nothing is left', () => {
    const memory = createGuestMemory()
    const both = memoryStore([1, 2])
    dropGuestIds(memory, [1], () => both.store)
    expect(both.saved()).toEqual([2])
    dropGuestIds(memory, [2], () => both.store)
    expect(both.items.has(STORAGE_KEY)).toBe(false)
  })

  it('writes nothing when nothing is stored or unsaved', () => {
    const memory = createGuestMemory()
    const { store, calls } = memoryStore()
    dropGuestIds(memory, [1], () => store)
    expect(calls.filter(c => !c.startsWith('get'))).toEqual([])
  })

  it('takes them out of the unsaved changes too', () => {
    const memory = createGuestMemory()
    markGuest(memory, 1, true, blocked)
    markGuest(memory, 2, true, blocked)
    dropGuestIds(memory, [1], blocked)
    expect(sorted(guestIds(memory, blocked))).toEqual([2])
  })

  it('stores the rest of the unsaved changes when storage takes the write', () => {
    const memory = createGuestMemory()
    markGuest(memory, 1, true, blocked)
    markGuest(memory, 2, true, blocked)
    const { store, saved } = memoryStore([5])
    dropGuestIds(memory, [1], () => store)
    expect(saved()).toEqual([2, 5])
    expect(memory.unsaved.size).toBe(0)
  })

  it("keeps a drop storage won't write in memory, over what it holds", () => {
    const memory = createGuestMemory()
    const { store, saved } = memoryStore([8, 9])
    store.setItem = () => {
      throw quotaError()
    }
    markGuest(memory, 1, true, () => store)
    dropGuestIds(memory, [9], () => store)
    expect(sorted(guestIds(memory, () => store))).toEqual([1, 8])
    expect(saved()).toEqual([8, 9])
  })

  it("keeps the drop and the unticks when storage won't remove the key", () => {
    const memory = createGuestMemory()
    const { store, saved } = memoryStore([5])
    store.setItem = () => {
      throw quotaError()
    }
    store.removeItem = () => {
      throw quotaError()
    }
    markGuest(memory, 5, false, () => store)
    markGuest(memory, 1, true, () => store)
    dropGuestIds(memory, [1], () => store)
    expect(sorted(guestIds(memory, () => store))).toEqual([])
    expect(saved()).toEqual([5])
  })

  it('never writes or removes what it could not read, and still drops from memory', () => {
    const memory = createGuestMemory()
    const { store, calls, items } = memoryStore([9])
    store.getItem = () => {
      throw securityError()
    }
    markGuest(memory, 1, true, () => store)
    dropGuestIds(memory, [1], () => store)
    expect(calls.filter(c => !c.startsWith('get'))).toEqual([])
    expect(items.get(STORAGE_KEY)).toBe('[9]')
    expect(sorted(guestIds(memory, () => store))).toEqual([])
  })
})
