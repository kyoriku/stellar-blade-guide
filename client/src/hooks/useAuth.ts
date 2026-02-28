import { useCallback } from 'react'
import { useAuthContext } from '../context/AuthContext'

/**
 * Main auth hook — use this everywhere in your components.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth()
 *   const { authFetch } = useAuth()  // for authenticated API calls
 */
export function useAuth() {
  const auth = useAuthContext()

  /**
   * A fetch wrapper that automatically attaches the Authorization header.
   * If the access token is expired, it attempts a silent refresh first.
   * Use this for any API call that requires authentication.
   *
   * Usage:
   *   const { authFetch } = useAuth()
   *   const data = await authFetch('/api/users/me')
   */
  const authFetch = useCallback(async (
    input: RequestInfo,
    init: RequestInit = {}
  ): Promise<Response> => {
    let token = auth.accessToken

    // If no token in memory, try refreshing first
    if (!token) {
      token = await auth.refreshToken()
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const res = await fetch(input, { ...init, headers, credentials: 'include' })

    // If 401, try one silent refresh then retry
    if (res.status === 401) {
      const newToken = await auth.refreshToken()
      if (!newToken) return res // refresh failed — let caller handle 401

      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      }
      return fetch(input, { ...init, headers: retryHeaders, credentials: 'include' })
    }

    return res
  }, [auth])

  return {
    ...auth,
    authFetch,
  }
}