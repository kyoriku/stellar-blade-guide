import { afterEach, describe, it, expect, vi } from 'vitest'
import { readItem, removeItem, storageProblem, writeItem, type StorageLike } from './storage'

// Vitest runs in Node, which has no window, so a Map stands in for storage, and each
// way a browser's storage can refuse gets a stand-in of its own.
function memoryStore(seed: Record<string, string> = {}) {
  const items = new Map(Object.entries(seed))
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
  return { store, items, calls }
}

const securityError = () => new DOMException('Access is denied for this document.', 'SecurityError')
const quotaError = () => new DOMException('The quota has been exceeded.', 'QuotaExceededError')

describe('a working store', () => {
  it('reads, writes and removes', () => {
    const { store, items } = memoryStore({ a: '1' })
    expect(readItem('a', () => store)).toBe('1')
    expect(readItem('missing', () => store)).toBeNull()
    expect(writeItem('b', '2', () => store)).toBe(true)
    expect(items.get('b')).toBe('2')
    removeItem('a', () => store)
    expect(items.has('a')).toBe(false)
  })

  it('has no problem, and the check makes one read', () => {
    const { store, calls } = memoryStore()
    expect(storageProblem(() => store)).toBeNull()
    expect(calls).toEqual(['get sb_has_session'])
  })
})

describe('storage the browser refuses (the getter throws)', () => {
  const blocked = (): never => {
    throw securityError()
  }

  it('reads null, writes nothing and removes quietly', () => {
    expect(readItem('a', blocked)).toBeNull()
    expect(writeItem('a', '1', blocked)).toBe(false)
    expect(() => removeItem('a', blocked)).not.toThrow()
  })

  it('is blocked', () => {
    expect(storageProblem(blocked)).toBe('blocked')
  })
})

describe('no storage at all (the getter returns null)', () => {
  const none = () => null

  it('reads null, writes nothing and removes quietly', () => {
    expect(readItem('a', none)).toBeNull()
    expect(writeItem('a', '1', none)).toBe(false)
    expect(() => removeItem('a', none)).not.toThrow()
  })

  it('is off', () => {
    expect(storageProblem(none)).toBe('off')
  })
})

describe('storage that refuses writes', () => {
  function fullStore() {
    const { store, items, calls } = memoryStore({ a: '1' })
    store.setItem = (key) => {
      calls.push(`set ${key}`)
      throw quotaError()
    }
    return { store, items, calls }
  }

  it('says the write failed, and still reads and removes', () => {
    const { store, items } = fullStore()
    expect(writeItem('b', '2', () => store)).toBe(false)
    expect(items.has('b')).toBe(false)
    expect(readItem('a', () => store)).toBe('1')
    removeItem('a', () => store)
    expect(items.has('a')).toBe(false)
  })

  it('has no problem, since the check never writes', () => {
    const { store, calls } = fullStore()
    expect(storageProblem(() => store)).toBeNull()
    expect(calls).toEqual(['get sb_has_session'])
  })
})

describe('storage whose reads throw', () => {
  const { store } = memoryStore({ a: '1' })
  store.getItem = () => {
    throw securityError()
  }

  it('reads null and is blocked', () => {
    expect(readItem('a', () => store)).toBeNull()
    expect(storageProblem(() => store)).toBe('blocked')
  })
})

describe('storage whose removal throws', () => {
  const { store } = memoryStore({ a: '1' })
  store.removeItem = () => {
    throw securityError()
  }

  it('removes quietly', () => {
    expect(() => removeItem('a', () => store)).not.toThrow()
  })
})

describe('the default store, which reads window.localStorage on each call', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('never throws, with no window to reach (Node)', () => {
    expect(readItem('a')).toBeNull()
    expect(writeItem('a', '1')).toBe(false)
    expect(() => removeItem('a')).not.toThrow()
    expect(storageProblem()).toBe('blocked')
  })

  it('is off when storage is switched off (null)', () => {
    vi.stubGlobal('window', { localStorage: null })
    expect(storageProblem()).toBe('off')
    expect(readItem('a')).toBeNull()
    expect(writeItem('a', '1')).toBe(false)
    expect(() => removeItem('a')).not.toThrow()
  })

  it('is blocked when the browser refuses it (the getter throws)', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw securityError()
      },
    })
    expect(storageProblem()).toBe('blocked')
    expect(readItem('a')).toBeNull()
    expect(writeItem('a', '1')).toBe(false)
    expect(() => removeItem('a')).not.toThrow()
  })
})
