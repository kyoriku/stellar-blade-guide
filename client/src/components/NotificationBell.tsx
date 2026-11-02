import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import BusyLabel from './BusyLabel'
import { useNotifications } from '../hooks/useNotifications'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../services/api'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificationBell() {
  const { items, unreadCount, markRead, markAllRead, markingAllRead } = useNotifications()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  // A Mark all read that landed, which the panel's live region reads out. Cleared when
  // the panel closes, so a reopened panel doesn't read it again.
  const [markedAll, setMarkedAll] = useState(false)
  const panelId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLParagraphElement>(null)
  const closePanel = () => {
    setOpen(false)
    setMarkedAll(false)
  }
  // Read synchronously, so a second press before the busy state renders sends nothing.
  const markingAll = useRef(false)
  const onMarkAllRead = () => {
    if (markingAll.current) return
    markingAll.current = true
    setMarkedAll(false)
    markAllRead(undefined, {
      onSuccess: () => setMarkedAll(true),
      // The panel has no place for an error, so a refusal is a toast.
      onError: err => showToast(errorMessage(err, 'Failed to mark notifications as read')),
      onSettled: () => { markingAll.current = false },
    })
  }
  // Mark all read leaves once nothing is unread. If it leaves with focus on it, focus
  // moves to the panel's heading rather than dropping to the page. React runs a ref's
  // cleanup before it removes the element, so focus can still be read off the button.
  // Stable, so the cleanup runs only when the button leaves.
  const markAllRef = useCallback((button: HTMLButtonElement | null) => {
    if (!button) return
    return () => {
      if (document.activeElement === button) headingRef.current?.focus()
    }
  }, [])

  // Close on a mousedown anywhere outside the bell and its panel.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setMarkedAll(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="relative hidden lg:flex h-10 items-center" ref={ref}>
      <button
        onClick={() => (open ? closePanel() : setOpen(true))}
        // Says whether the panel is open, as the drawer's button does.
        aria-expanded={open}
        aria-controls={panelId}
        className="relative flex items-center p-2 rounded-lg text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors cursor-pointer"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center rounded-full bg-cyan-500 text-black text-[10px] font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div id={panelId} className={`absolute right-0 top-full mt-2 w-80 bg-nav backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden transition-all duration-200 ${open ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible translate-y-2 pointer-events-none'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          {/* Focusable for Mark all read leaving with focus on it (markAllRef). */}
          <p ref={headingRef} tabIndex={-1} className="text-sm font-medium text-white">Notifications</p>
          {unreadCount > 0 && (
            <button
              ref={markAllRef}
              onClick={onMarkAllRead}
              // Busy while its request is out, and a second press sends nothing.
              aria-busy={markingAllRead}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer aria-busy:cursor-progress"
            >
              <BusyLabel label="Mark all read" busy={markingAllRead} />
            </button>
          )}
          {/* The button keeps its name while busy, so the busy text is read out from here,
              and then the result, which outlasts the button. */}
          <span className="sr-only" aria-live="polite">{markingAllRead ? 'Marking all read…' : markedAll ? 'All marked read.' : ''}</span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No notifications yet.</p>
          ) : (
            items.map(n => (
              <Link
                key={n.id}
                to={n.url}
                onClick={() => {
                  // Refetch the thread so the linked reply is present (cache may be stale).
                  void queryClient.invalidateQueries({ queryKey: ['comments', n.content_type, n.content_id] })
                  markRead(n.id)
                  closePanel()
                }}
                className={`block px-4 py-3 text-sm border-l-2 transition-[color,background-color] duration-150 ${n.is_read
                  ? 'border-transparent text-gray-400 hover:bg-gray-800/50 hover:border-gray-400'
                  : 'border-cyan-400 bg-cyan-500/5 text-gray-200 hover:bg-gray-800/50'
                  }`}
              >
                <span>
                  <span className="font-medium text-white">{n.actor_username ?? 'Someone'}</span>
                  {' replied to your comment on '}
                  <span className="text-cyan-400">{n.label}</span>
                </span>
                <div className="text-xs text-gray-500 mt-0.5">{timeAgo(n.created_at)}</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
