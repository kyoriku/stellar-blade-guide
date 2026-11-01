import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ErrorPage from '../pages/ErrorPage'

export default function ProtectedRoute({
  children,
  renderWhileRestoring = false,
  adminOnly = false,
}: {
  children: React.ReactNode
  // Opt-in for pages whose loading chrome is fully static (no user data in
  // the shell): render it during the auth-restore round-trip instead of the
  // one-viewport spinner, so the page doesn't jump from a short spinner page
  // (footer visible) to full height. The guard still redirects once auth
  // resolves. Default stays the spinner — pages like Settings read `user` at
  // mount and must not render before the session is confirmed.
  renderWhileRestoring?: boolean
  // The admin page: anyone signed in without the admin role sees the same 404 page
  // an unknown path gets. That hides nothing (the server's head for /admin, the API's
  // 401 and 403, and the bundle all show the page exists); the server checks the role
  // on every request, and this only decides what renders.
  adminOnly?: boolean
}) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    if (renderWhileRestoring && !adminOnly) return <>{children}</>
    return (
      <div className="bg-primary flex flex-1 items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (adminOnly && user.role !== 'admin') return <ErrorPage />

  return <>{children}</>
}
