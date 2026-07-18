import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { API_BASE_URL, readError } from '../services/api'
import { useToast } from './ToastContext'

// Hint flag — not a security mechanism, just avoids a pointless refresh call
// for unauthenticated visitors. Worst case: cleared localStorage causes one
// 401 on next load, which then clears the flag and never happens again.
export const SESSION_FLAG = 'sb_has_session'

// Refresh on tab focus only if the token is at least this stale, so rapid
// tab-switching doesn't hammer /auth/refresh. Comfortably below the 15-min
// access-token TTL so any real idle period refreshes while the cookie is valid.
const REFRESH_ON_FOCUS_STALE_MS = 10 * 60 * 1000 // 10 minutes

// Types
export interface AuthUser {
  id: number
  email: string
  username: string
  avatar_url: string | null
  role: 'user' | 'moderator' | 'admin'
  created_at: string
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

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string | null>
}

// Context
const AuthContext = createContext<AuthContextValue | null>(null)

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readCachedUser())
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // true until initial refresh resolves
  const { showToast } = useToast()

  // Single-flight guard: concurrent refreshes would race the server's token
  // rotation (the first call revokes the cookie the second still holds → 401 →
  // silent logout). Reuse the in-flight promise instead of issuing a second call.
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null)
  // Timestamp of the last successful token acquisition; drives the focus check.
  const lastRefreshRef = useRef(0)

  // Restore the session from the HttpOnly refresh cookie. This is the single
  // refresh code path — mount restore, the 14-min interval, the focus handler,
  // the reactive 401 retry in useAuth, and the OAuth callback all go through
  // here, so every refreshed token is stamped in exactly one place.
  const refreshToken = useCallback((): Promise<string | null> => {
    // Single-flight: if a refresh is already running, reuse it.
    if (refreshInFlightRef.current) return refreshInFlightRef.current

    const run = async (): Promise<string | null> => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // send the HttpOnly cookie
        })
        if (!res.ok) {
          setUser(null)
          setAccessToken(null)
          // Only a definitive 401 ends the session: clear the hint and tell the
          // user. A 503 (Redis outage) or other transient failure must not —
          // the hint survives so the next load retries, and the in-memory
          // teardown self-heals on the next successful refresh.
          if (res.status === 401) {
            localStorage.removeItem(SESSION_FLAG)
            showToast('Your session expired — please log in again.')
          }
          return null
        }
        const data = await res.json()
        setUser(data.user)
        setAccessToken(data.access_token)
        lastRefreshRef.current = Date.now()
        return data.access_token
      } catch {
        // Network failure — never definitive; keep the hint so the next load
        // retries, and stay silent (no false logout announcement mid-outage).
        setUser(null)
        setAccessToken(null)
        return null
      } finally {
        refreshInFlightRef.current = null
      }
    }

    const p = run()
    refreshInFlightRef.current = p
    return p
  }, [showToast]) // stable (ToastContext useCallback), so refreshToken identity holds

  // Mirror only the display fields into localStorage on every change, so the
  // next reload hydrates the avatar/bell instantly (the refresh reconciles it).
  useEffect(() => {
    try {
      if (user) {
        const { id, username, avatar_url, role } = user
        localStorage.setItem(USER_CACHE, JSON.stringify({ id, username, avatar_url, role }))
      } else {
        localStorage.removeItem(USER_CACHE)
      }
    } catch { /* localStorage unavailable / quota — non-fatal */ }
  }, [user])

  // Silent refresh on mount — skip entirely if no session flag is set,
  // meaning this visitor has never logged in (or has since logged out).
  useEffect(() => {
    if (!localStorage.getItem(SESSION_FLAG)) {
      setIsLoading(false)
      return
    }
    refreshToken().finally(() => setIsLoading(false))
  }, [refreshToken])

  // Proactive token refresh — refresh 1 minute before the 15 min expiry (the
  // server's ACCESS_TOKEN_EXPIRE_MINUTES; keep this interval below that TTL)
  useEffect(() => {
    if (!accessToken) return
    const interval = setInterval(() => {
      refreshToken()
    }, 14 * 60 * 1000) // every 14 minutes
    return () => clearInterval(interval)
  }, [accessToken, refreshToken])

  // Background tabs throttle/freeze the interval above (and timers don't advance
  // during system sleep), so a token can silently expire while hidden. When the
  // tab becomes visible again, refresh if the token is stale — single-flight in
  // refreshToken collapses the visibilitychange + focus pair into one network call.
  useEffect(() => {
    if (!accessToken) return
    const refreshIfStale = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastRefreshRef.current > REFRESH_ON_FOCUS_STALE_MS) {
        void refreshToken()
      }
    }
    document.addEventListener('visibilitychange', refreshIfStale)
    window.addEventListener('focus', refreshIfStale)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfStale)
      window.removeEventListener('focus', refreshIfStale)
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
          const ids = JSON.parse(local)
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
        } catch { }
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
    const data = await res.json()
    setUser(data.user)
    setAccessToken(data.access_token)
    lastRefreshRef.current = Date.now()
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
    const data = await res.json()
    setUser(data.user)
    setAccessToken(data.access_token)
    lastRefreshRef.current = Date.now()
    localStorage.setItem(SESSION_FLAG, '1')
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setUser(null)
      setAccessToken(null)
      localStorage.removeItem(SESSION_FLAG)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Internal hook (used by useAuth.ts)
export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}