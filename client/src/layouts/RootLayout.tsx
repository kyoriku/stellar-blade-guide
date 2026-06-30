import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import ScrollToTop from '../components/ScrollToTop'
import Footer from '../components/Footer'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { useNotifications, NOTIFICATIONS_KEY } from '../hooks/useNotifications'

const NOTIF_STALE_MS = 30 * 1000

function RootLayout() {
  const { isAuthenticated } = useAuth()
  const { items, refetch, markRead } = useNotifications()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const lastSeenId = useRef<number | null>(null)

  // Fetch-on-navigation, staleness-guarded so rapid nav within the window doesn't
  // stack requests (pairs with refetchOnWindowFocus + refetchOnMount in the hook).
  useEffect(() => {
    if (!isAuthenticated) return
    const last = queryClient.getQueryState(NOTIFICATIONS_KEY)?.dataUpdatedAt ?? 0
    if (Date.now() - last > NOTIF_STALE_MS) void refetch()
  }, [location.pathname, isAuthenticated, refetch, queryClient])

  // Toast newly-arrived replies. On the first load of a session we only baseline
  // (the backlog shows via the bell count, no toast blast); afterwards, fresh
  // arrivals toast — one each, or a single summary if several land at once.
  useEffect(() => {
    if (!isAuthenticated) { lastSeenId.current = null; return }
    if (items.length === 0) return
    const maxId = Math.max(...items.map(i => i.id))
    if (lastSeenId.current === null) { lastSeenId.current = maxId; return }
    const fresh = items.filter(i => i.id > (lastSeenId.current as number) && !i.is_read)
    lastSeenId.current = maxId
    if (fresh.length === 1) {
      const n = fresh[0]
      showToast(`${n.actor_username ?? 'Someone'} replied to your comment on ${n.label}`, {
        variant: 'info',
        onClick: () => {
          // Refetch the thread so the linked reply is present (cache may be stale).
          void queryClient.invalidateQueries({ queryKey: ['comments', n.content_type, n.content_id] })
          markRead(n.id)
          void navigate(n.url)
        },
        duration: 10000,
      })
    } else if (fresh.length > 1) {
      showToast(`${fresh.length} new replies to your comments`, { variant: 'info', duration: 10000 })
    }
  }, [items, isAuthenticated, showToast, navigate, markRead, queryClient])

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
