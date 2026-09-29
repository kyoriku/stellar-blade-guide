import { describe, it, expect, vi, afterEach } from 'vitest'
import { withRefreshLock, refreshLockManager, REFRESH_LOCK, type RefreshLocks } from './refreshLock'

// The lock only orders the request; everything pinned here is about never making
// a refresh worse than it was without one: the request is sent exactly once, its
// own failure surfaces unchanged, and a lock that cannot be had (no Web Locks, a
// refused request, a wait past the bound) falls back to refreshing unlocked.

type Callback = (lock: Lock | null) => unknown

function fakeLocks(grant: (options: LockOptions, callback: Callback) => Promise<unknown>) {
  const names: string[] = []
  const locks = {
    request(name: string, options: LockOptions, callback: Callback) {
      names.push(name)
      return grant(options, callback)
    },
  } as RefreshLocks
  return { locks, names }
}

const denied = () => new DOMException('The request was denied.', 'SecurityError')

describe('withRefreshLock', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('refreshes without a lock where the browser has no lock manager', async () => {
    const refresh = vi.fn(() => Promise.resolve('token'))
    await expect(withRefreshLock(refresh, null)).resolves.toBe('token')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('runs the refresh while holding the lock and returns its result', async () => {
    let holding = false
    let heldDuringRefresh = false
    const { locks, names } = fakeLocks(async (_options, callback) => {
      holding = true
      try {
        return await callback(null)
      } finally {
        holding = false
      }
    })
    const refresh = vi.fn(() => {
      heldDuringRefresh = holding
      return Promise.resolve('token')
    })

    await expect(withRefreshLock(refresh, locks)).resolves.toBe('token')
    expect(names).toEqual([REFRESH_LOCK])
    expect(heldDuringRefresh).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('refreshes unlocked when the lock is refused before it is granted', async () => {
    const { locks } = fakeLocks(() => Promise.reject(denied()))
    const refresh = vi.fn(() => Promise.resolve('token'))
    await expect(withRefreshLock(refresh, locks)).resolves.toBe('token')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('surfaces a refresh that fails inside the lock, and never sends it twice', async () => {
    const { locks } = fakeLocks((_options, callback) => Promise.resolve().then(() => callback(null)))
    const failure = new TypeError('Failed to fetch')
    const refresh = vi.fn(() => Promise.reject(failure))
    await expect(withRefreshLock(refresh, locks)).rejects.toBe(failure)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('stops waiting at the bound and refreshes unlocked', async () => {
    vi.useFakeTimers()
    const { locks } = fakeLocks(
      (options) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => reject(denied()))
        }),
    )
    const refresh = vi.fn(() => Promise.resolve('token'))

    const result = withRefreshLock(refresh, locks, 4000)
    await vi.advanceTimersByTimeAsync(3999)
    expect(refresh).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await expect(result).resolves.toBe('token')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('never aborts a lock granted within the bound', async () => {
    vi.useFakeTimers()
    let signal: AbortSignal | undefined
    const { locks } = fakeLocks((options, callback) => {
      signal = options.signal
      return Promise.resolve().then(() => callback(null))
    })

    await withRefreshLock(() => Promise.resolve('token'), locks, 4000)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(signal?.aborted).toBe(false)
  })
})

describe('refreshLockManager', () => {
  it('is null where the browser has no Web Locks', () => {
    expect(refreshLockManager({} as Navigator)).toBeNull()
  })

  it('is null where reading navigator.locks throws', () => {
    const nav = {
      get locks(): LockManager {
        throw denied()
      },
    } as Navigator
    expect(refreshLockManager(nav)).toBeNull()
  })

  it('is the browser lock manager where there is one', () => {
    const locks = {} as LockManager
    expect(refreshLockManager({ locks } as Navigator)).toBe(locks)
  })
})
