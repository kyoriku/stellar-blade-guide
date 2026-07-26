import { createContext, useContext } from 'react'

// Context definition + consumer hook live here, separate from AuthProvider in
// context/AuthContext.tsx, so that file only exports components (react-refresh).

export interface AuthUser {
  id: number
  email: string
  username: string
  avatar_url: string | null
  role: 'user' | 'moderator' | 'admin'
  created_at: string
}

export interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isRestoring: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// Internal hook (used by useAuth.ts)
export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}
