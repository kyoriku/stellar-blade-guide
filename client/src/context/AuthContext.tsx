import { useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL, readError } from '../services/api'
import { useToast } from './ToastContext'
import { AuthContext, type AuthUser } from '../hooks/useAuthContext'

// Hint flag — not a security mechanism, just avoids a pointless refresh call
// for unauthenticated visitors. Worst case: cleared localStorage causes one
// 401 on next load, which then clears the flag and never happens again.
export const SESSION_FLAG = 'sb_has_session'

// Refresh on tab focus only if the token is at least this stale, so rapid
// tab-switching doesn't hammer /auth/refresh. Comfortably below the 15-min
// access-token TTL so any real idle period refreshes while the cookie is valid.
const REFRESH_ON_FOCUS_STALE_MS = 10 * 60 * 1000 // 10 minutes

// Max time an UNCONFIRMED session may render optimistically (cached identity,
// or the neutral placeholder when no cache exists). The refresh's try/finally
// clears the in-flight flag on every settle, so the only way to dangle is a
// fetch that never resolves — on expiry the in-memory display state (user +
// token) is torn down to honest signed-out, while the hint and display cache
// survive so focus-recovery or the next load can retry. Confirmed sessions are
// exempt: a hung 14-min rotation never logs the UI out.
const RESTORE_MAX_MS = 8000

// Shape of the /auth/login, /auth/register, and /auth/refresh success bodies.
interface AuthResponse {
  user: AuthUser
  access_token: string
}

// Cached *display* user so the navbar avatar + bell render instantly on reload,
// before the silent /auth/refresh resolves. Only the fields needed to paint —
// no email (PII) or created_at, which the refresh fills a moment later. The
// access token is NEVER stored here; it stays in memory only.
const USER_CACHE = 'sb_user'

type CachedUser = Pick<AuthUser, 'id' | 'username' | 'avatar_url' | 'role'>

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE)
    if (!raw) return null
    const d = JSON.parse(raw) as CachedUser
    // email/created_at aren't cached; the refresh overwrites the whole user.
    return { ...d, email: '', created_at: '' }
  } catch {
    return null
  }
}

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readCachedUser())
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // true until initial refresh resolves
  // Whether a token refresh is currently running. Unlike isLoading (which only
  // covers the initial mount and never re-arms), this brackets EVERY refresh —
  // including focus-recovery — so it can drive the "restoring" navbar state.
  // Seeded from the hint so a returning user's first paint already reads as
  // restoring, with no one-frame Sign-in flash before the mount refresh starts.
  const [isRefreshing, setIsRefreshing] = useState(() => !!localStorage.getItem(SESSION_FLAG))
  const { showToast } = useToast()

  // Single-flight guard: concurrent refreshes would race the server's token
  // rotation (the first call revokes the cookie the second still holds → 401 →
  // silent logout). Reuse the in-flight promise instead of issuing a second call.
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null)
  // Timestamp of the last successful token acquisition; drives the focus check.
  const lastRefreshRef = useRef(0)
  // Whether this session's identity has been confirmed by the server (a
  // successful refresh, login, or register). Until then the rendered identity
  // is optimistic (seeded from the sb_user cache) and subject to the
  // RESTORE_MAX_MS bound below — a confirmed session is never torn down by it.
  const confirmedRef = useRef(false)

  // Restore the session from the HttpOnly refresh cookie. This is the single
  // refresh code path — mount restore, the 14-min interval, the focus handler,
  // the reactive 401 retry in useAuth, and the OAuth callback all go through
  // here, so every refreshed token is stamped in exactly one place.
  const refreshToken = useCallback((): Promise<string | null> => {
    // Single-flight: if a refresh is already running, reuse it.
    if (refreshInFlightRef.current) return refreshInFlightRef.current

    const run = async (): Promise<string | null> => {
      setIsRefreshing(true)
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // send the HttpOnly cookie
        })
        if (!res.ok) {
          setAccessToken(null)
          // Only a definitive 401 ends the session: tear down the displayed
          // identity, clear the hint + display cache, and tell the user. A 503
          // (Redis outage) or other transient failure must NOT — the session is
          // live server-side, so the cached identity keeps rendering (pixels
          // only; the nulled token still gates every authenticated action) and
          // the hint survives so focus-recovery / the next load retries.
          if (res.status === 401) {
            setUser(null)
            confirmedRef.current = false // this session is over — the next optimistic restore is unconfirmed again
            localStorage.removeItem(SESSION_FLAG)
            localStorage.removeItem(USER_CACHE)
            showToast('Your session expired — please log in again.')
          }
          return null
        }
        const data = (await res.json()) as AuthResponse
        setUser(data.user)
        setAccessToken(data.access_token)
        lastRefreshRef.current = Date.now()
        confirmedRef.current = true
        return data.access_token
      } catch {
        // Network failure — never definitive; keep the displayed identity and
        // the hint (the network broke, not the session), stay silent, and only
        // drop the token so actions re-authenticate when connectivity returns.
        setAccessToken(null)
        return null
      } finally {
        setIsRefreshing(false)
        refreshInFlightRef.current = null
      }
    }

    const p = run()
    refreshInFlightRef.current = p
    return p
  }, [showToast]) // stable (ToastContext useCallback), so refreshToken identity holds

  // Mirror only the display fields into localStorage whenever the user is set,
  // so the next reload hydrates the avatar/bell instantly (the refresh
  // reconciles it). Write-only on purpose: removal is explicit at the two
  // definitive teardown sites (the 401 branch and logout), mirroring the
  // session hint's gating — a transient failure must never wipe the display
  // cache the optimistic render depends on.
  useEffect(() => {
    if (!user) return
    try {
      const { id, username, avatar_url, role } = user
      localStorage.setItem(USER_CACHE, JSON.stringify({ id, username, avatar_url, role }))
    } catch { /* localStorage unavailable / quota — non-fatal */ }
  }, [user])

  // Silent refresh on mount — skip entirely if no session flag is set,
  // meaning this visitor has never logged in (or has since logged out).
  useEffect(() => {
    if (!localStorage.getItem(SESSION_FLAG)) {
      setIsLoading(false)
      return
    }
    void refreshToken().finally(() => setIsLoading(false))
  }, [refreshToken])

  // Proactive token refresh — refresh 1 minute before the 15 min expiry (the
  // server's ACCESS_TOKEN_EXPIRE_MINUTES; keep this interval below that TTL)
  useEffect(() => {
    if (!accessToken) return
    const interval = setInterval(() => {
      void refreshToken()
    }, 14 * 60 * 1000) // every 14 minutes
    return () => clearInterval(interval)
  }, [accessToken, refreshToken])

  // Background tabs throttle/freeze the interval above (and timers don't advance
  // during system sleep), so a token can silently expire — or a refresh fired at
  // machine-wake can fail on not-yet-restored network and null it — while hidden.
  // On return, recover based on the session hint, NOT accessToken: a transient
  // failure leaves the hint intact but the token null, and gating on the token
  // would strand the tab looking logged-out until a manual reload. Single-flight
  // in refreshToken collapses the visibilitychange + focus pair into one call.
  useEffect(() => {
    const refreshIfNeeded = () => {
      if (document.visibilityState !== 'visible') return
      if (!localStorage.getItem(SESSION_FLAG)) return // genuinely logged out — nothing to recover
      const tokenMissing = !accessToken               // dropped by a transient failure → recover now
      const stale = Date.now() - lastRefreshRef.current > REFRESH_ON_FOCUS_STALE_MS
      if (tokenMissing || stale) void refreshToken()
    }
    document.addEventListener('visibilitychange', refreshIfNeeded)
    window.addEventListener('focus', refreshIfNeeded)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfNeeded)
      window.removeEventListener('focus', refreshIfNeeded)
    }
  }, [accessToken, refreshToken])

  const prevAuthRef = useRef(false)

  useEffect(() => {
    if (!isLoading && user && !prevAuthRef.current) {
      // 'sb_progress' must match STORAGE_KEY in hooks/useProgress.ts — drift
      // means guest progress silently never merges (or never clears) on login.
      const local = localStorage.getItem('sb_progress')
      if (local) {
        try {
          const ids = JSON.parse(local) as number[]
          if (ids.length > 0) {
            fetch(`${API_BASE_URL}/progress/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ collectible_ids: ids }),
            }).then(res => {
              if (res.ok) localStorage.removeItem('sb_progress')
              else showToast("Couldn't sync your saved progress — it's still saved on this device.")
            }).catch(() => showToast("Couldn't sync your saved progress — it's still saved on this device."))
          }
        } catch { /* corrupt sb_progress JSON — nothing to sync */ }
      }
    }
    prevAuthRef.current = !!user
  }, [user, isLoading, accessToken, showToast])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      throw new Error(await readError(res, 'Login failed'))
    }
    const data = (await res.json()) as AuthResponse
    setUser(data.user)
    setAccessToken(data.access_token)
    lastRefreshRef.current = Date.now()
    confirmedRef.current = true
    localStorage.setItem(SESSION_FLAG, '1')
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, username, password }),
    })
    if (!res.ok) {
      throw new Error(await readError(res, 'Registration failed'))
    }
    const data = (await res.json()) as AuthResponse
    setUser(data.user)
    setAccessToken(data.access_token)
    lastRefreshRef.current = Date.now()
    confirmedRef.current = true
    localStorage.setItem(SESSION_FLAG, '1')
  }, [])

  const queryClient = useQueryClient()

  // Identity-change guard: whenever the signed-in id changes to a DIFFERENT
  // id — login after a 401-dead session, registering a second account while
  // signed in, any path that skips logout — per-user query data from the
  // previous identity must be dropped, or the unscoped ['progress'] key
  // serves the old account's completion set until its staleTime lapses.
  const prevUserIdRef = useRef<number | null>(null)
  useEffect(() => {
    const id = user?.id ?? null
    if (id === null) return // signed out: logout/teardown handles its own clearing
    if (prevUserIdRef.current !== null && id !== prevUserIdRef.current) {
      queryClient.removeQueries({ queryKey: ['progress'] })
      queryClient.removeQueries({ queryKey: ['user-stats'] })
    }
    prevUserIdRef.current = id
  }, [user, queryClient])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setUser(null)
      setAccessToken(null)
      confirmedRef.current = false // a later restore in this tab must re-arm the bound
      localStorage.removeItem(SESSION_FLAG)
      localStorage.removeItem(USER_CACHE)
      // Per-user query data must not survive into a different account's
      // session on this tab: ['progress'] is an unscoped key with a 5-minute
      // staleTime, so without this a second sign-in inherits the previous
      // account's completion set (navbar ring, stats hero, checkboxes) until
      // it lapses. ['user-stats'] is id-scoped but dropped as the same hygiene.
      queryClient.removeQueries({ queryKey: ['progress'] })
      queryClient.removeQueries({ queryKey: ['user-stats'] })
    }
  }, [queryClient])

  // Unconfirmed-session bound: while a refresh runs for a session the server
  // has not yet confirmed, the UI is rendering optimistically (cached identity,
  // or the neutral placeholder when no cache exists). A refresh that HANGS past
  // RESTORE_MAX_MS must resolve that optimism to signed-out — no infinite
  // unconfirmed signed-in state. Hint and display cache survive (hung ≠
  // definitive), so focus-recovery or the next load can still heal. A confirmed
  // session is never torn down by this: a later hung rotation (the 14-min
  // timer) skips the bound entirely.
  const [restoreExpired, setRestoreExpired] = useState(false)
  useEffect(() => {
    if (!isRefreshing) {
      setRestoreExpired(false)
      return
    }
    if (confirmedRef.current) return
    const timer = setTimeout(() => {
      // Re-check at fire time: a manual login while an old fetch hung must win.
      if (confirmedRef.current) return
      setRestoreExpired(true)
      setUser(null)
      setAccessToken(null)
    }, RESTORE_MAX_MS)
    return () => clearTimeout(timer)
  }, [isRefreshing])

  // "Restoring": hint says there's a session but no identity is renderable
  // (sb_user missing/corrupt — rare, since cache and hint now live and die
  // together) and a refresh is running. The navbar shows a neutral static
  // placeholder for this window instead of flashing "Sign in"; restoreExpired
  // suppresses it after a bound teardown so the fallback is the real
  // signed-out state.
  const isRestoring = !!localStorage.getItem(SESSION_FLAG) && user === null && isRefreshing && !restoreExpired

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!user,
      isRestoring,
      login,
      register,
      logout,
      refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}