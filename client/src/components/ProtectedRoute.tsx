import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({
  children,
  renderWhileRestoring = false,
}: {
  children: React.ReactNode
  // Opt-in for pages whose loading chrome is fully static (no user data in
  // the shell): render it during the auth-restore round-trip instead of the
  // one-viewport spinner, so the page doesn't jump from a short spinner page
  // (footer visible) to full height. The guard still redirects once auth
  // resolves. Default stays the spinner — pages like Settings read `user` at
  // mount and must not render before the session is confirmed.
  renderWhileRestoring?: boolean
}) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    if (renderWhileRestoring) return <>{children}</>
    return (
      <div className="bg-primary flex items-center justify-center" style={{ minHeight: 'calc(100vh - 174px)' }}>
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}