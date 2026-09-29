// Tabs of one browser share the HttpOnly refresh cookie. Two tabs refreshing at
// once present the same cookie, the server rotates it twice (tolerated by design),
// and one successor is never used. A Web Lock held across the request makes the
// next tab send its request only after the previous response set the new cookie,
// so it presents that one. Each tab still gets its own access token.

// Must match the lock name the e2e spec queries.
export const REFRESH_LOCK = 'sb_auth_refresh'

// How long a tab waits for another tab's refresh before refreshing without the
// lock, which is exactly the behaviour before the lock existed. It must stay far
// below the server's 60 s grace: a waiter that finally sends a cookie the holder
// already rotated recovers as a grace retry inside it, and signs the whole session
// out as a reuse after it. Below RESTORE_MAX_MS too, so a waiting tab's restore
// keeps time for its own request. A Chrome tab hidden for over five minutes can
// see this timer throttled to about a minute; that needs a hung holder and a lost
// response as well, and is accepted.
export const REFRESH_LOCK_WAIT_MS = 4000

// The one method used, typed narrowly so a test double can stand in for it.
export interface RefreshLocks {
  request<T>(name: string, options: LockOptions, callback: (lock: Lock | null) => T): Promise<T>
}

// navigator.locks, or null where it is missing (older browsers, insecure
// contexts) or its getter throws.
export function refreshLockManager(nav: Navigator | undefined = globalThis.navigator): RefreshLocks | null {
  try {
    return nav?.locks ?? null
  } catch {
    return null
  }
}

export async function withRefreshLock<T>(
  fn: () => Promise<T>,
  locks: RefreshLocks | null = refreshLockManager(),
  waitMs: number = REFRESH_LOCK_WAIT_MS,
): Promise<T> {
  if (!locks) return fn()
  const giveUp = new AbortController()
  const timer = setTimeout(() => giveUp.abort(), waitMs)
  let granted = false
  try {
    // `return await`, not `return`: a refused or aborted lock must reject inside
    // this try, so the catch can fall back instead of failing the refresh.
    return await locks.request(REFRESH_LOCK, { signal: giveUp.signal }, () => {
      granted = true
      clearTimeout(timer)
      return fn()
    })
  } catch (err) {
    // The request's own failure surfaces unchanged, so it is never sent twice.
    // Only a lock that was never granted (refused, or the wait ran out) falls back.
    if (granted) throw err
    return fn()
  } finally {
    clearTimeout(timer)
  }
}
