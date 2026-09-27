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
    <div
      // svh, not dvh: dvh grows when the mobile bars collapse, which would scroll
      // a page sized between the two viewports and snap it back to the top.
      className="flex flex-col min-h-svh bg-primary print:min-h-0"
    >
      <ScrollToTop />
      <Navbar />
      {/* Spacer for the out-of-flow fixed navbar, plus the gap above the footer,
          carried here so no page repeats them. Pages fill with flex-1, so the
          layout never needs to know the footer's height. */}
      <div className="flex flex-1 flex-col pt-(--nav-height) pb-16">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

export default RootLayout
