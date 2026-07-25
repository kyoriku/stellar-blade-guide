import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import ScrollToTop from '../components/ScrollToTop'
import Footer from '../components/Footer'
import { useAuth } from '../hooks/useAuth'
import { useNotifications, NOTIFICATIONS_KEY } from '../hooks/useNotifications'

const NOTIF_STALE_MS = 30 * 1000

function RootLayout() {
  const { isAuthenticated, accessToken } = useAuth()
  const { refetch } = useNotifications()
  const queryClient = useQueryClient()
  const location = useLocation()

  // Keep the bell fresh on route changes (pairs with refetchOnWindowFocus +
  // refetchOnMount in the hook), staleness-guarded so rapid nav within the window
  // doesn't stack requests. Reply notifications surface in the bell only — no toast.
  // Token-gated, not just identity-gated: refetch() bypasses the query's
  // `enabled`, and the optimistic identity survives transient refresh failures —
  // navigating during an outage must not fire tokenless requests.
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return
    const last = queryClient.getQueryState(NOTIFICATIONS_KEY)?.dataUpdatedAt ?? 0
    if (Date.now() - last > NOTIF_STALE_MS) void refetch()
  }, [location.pathname, isAuthenticated, accessToken, refetch, queryClient])

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <ScrollToTop />
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

export default RootLayout
