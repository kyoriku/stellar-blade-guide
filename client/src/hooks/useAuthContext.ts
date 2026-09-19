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
  // False for an account that signs in with a provider only. Optional because a user
  // restored from an sb_user cache written before this field existed does not have
  // it; "unknown" must behave like "has one", which is what the UI always assumed.
  has_password?: boolean
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
