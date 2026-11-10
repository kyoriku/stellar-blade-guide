// Site storage that never throws. A browser that refuses site storage (a cookie block
// in Safari, Chrome or Firefox) throws from window.localStorage itself, and an app's
// built-in browser can have no storage at all, so each call reaches for it inside its
// own try.

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
// A stand-in for the browser's storage, as tests pass; each function asks only for the
// methods it calls.
type StorageGetter<K extends keyof StorageLike> = () => Pick<StorageLike, K> | null

// Throws when the browser refuses storage and is null when it's switched off, which is
// how storageProblem tells the two apart.
function getLocalStorage(): Storage | null {
  return window.localStorage
}

/** The stored value, or null when there is none or storage refuses the read. */
export function readItem(key: string, store: StorageGetter<'getItem'> = getLocalStorage): string | null {
  try {
    return store()?.getItem(key) ?? null
  } catch {
    return null
  }
}

/** Stores a value, and says whether it was stored. */
export function writeItem(key: string, value: string, store: StorageGetter<'setItem'> = getLocalStorage): boolean {
  try {
    const s = store()
    if (!s) return false
    s.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeItem(key: string, store: StorageGetter<'removeItem'> = getLocalStorage): void {
  try {
    store()?.removeItem(key)
  } catch {
    // Refused storage: nothing to do.
  }
}

/**
 * Why the site can't use storage: 'blocked' when the browser refuses it (a cookie
 * block), 'off' when there is none (an app's built-in browser with storage switched
 * off), or null when it reads. It reads one key and writes nothing.
 */
export function storageProblem(store: StorageGetter<'getItem'> = getLocalStorage): 'blocked' | 'off' | null {
  try {
    const s = store()
    if (!s) return 'off'
    s.getItem('sb_has_session')
    return null
  } catch {
    return 'blocked'
  }
}
