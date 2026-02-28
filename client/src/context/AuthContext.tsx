import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number
  email: string
  username: string
  avatar_url: string | null
  role: 'user' | 'moderator' | 'admin'
  created_at: string
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

// ── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // true until initial refresh resolves

  // Attempt to restore session from the HttpOnly refresh cookie on mount
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // send the HttpOnly cookie
      })
      if (!res.ok) {
        setUser(null)
        setAccessToken(null)
        return null
      }
      const data = await res.json()
      setUser(data.user)
      setAccessToken(data.access_token)
      return data.access_token
    } catch {
      setUser(null)
      setAccessToken(null)
      return null
    }
  }, [])

  // Silent refresh on mount — restores session if cookie is valid
  useEffect(() => {
    refreshToken().finally(() => setIsLoading(false))
  }, [refreshToken])

  // Proactive token refresh — refresh 1 minute before the 15 min expiry
  useEffect(() => {
    if (!accessToken) return
    const interval = setInterval(() => {
      refreshToken()
    }, 14 * 60 * 1000) // every 14 minutes
    return () => clearInterval(interval)
  }, [accessToken, refreshToken])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      const detail = Array.isArray(err.detail)
        ? err.detail.map((e: any) => e.msg.replace('Value error, ', '')).join(', ')
        : err.detail || 'Login failed'
      throw new Error(detail)
    }
    const data = await res.json()
    setUser(data.user)
    setAccessToken(data.access_token)
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, username, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      const detail = Array.isArray(err.detail)
        ? err.detail.map((e: any) => e.msg.replace('Value error, ', '')).join(', ')
        : err.detail || 'Registration failed'
      throw new Error(detail)
    }
    const data = await res.json()
    setUser(data.user)
    setAccessToken(data.access_token)
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

// ── Internal hook (used by useAuth.ts) ────────────────────────────────────────

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}