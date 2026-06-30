import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// Lightweight, app-wide toast. Used for background/optimistic failures that have
// no inline home (progress toggle/load, guest-sync, walkthrough nav) and for
// reply notifications. Self-dismissing; never blocks the UI.
//
// `onClick` makes a toast actionable without coupling this provider to the
// router: the provider sits outside <BrowserRouter>, so callers (which are
// inside Router) pass a navigate callback rather than a route string.

interface Toast {
  id: number
  message: string
  variant: 'error' | 'info'
  onClick?: () => void
  duration: number
}

interface ToastContextValue {
  showToast: (message: string, opts?: { variant?: 'error' | 'info'; onClick?: () => void; duration?: number }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Arm (or re-arm) a toast's auto-dismiss timer.
  const scheduleDismiss = useCallback((id: number, duration: number) => {
    timers.current.set(id, setTimeout(() => dismiss(id), duration))
  }, [dismiss])

  // Pause auto-dismiss (while hovered) without removing the toast.
  const pauseDismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const showToast = useCallback((message: string, opts?: { variant?: 'error' | 'info'; onClick?: () => void; duration?: number }) => {
    const id = nextId.current++
    const variant = opts?.variant ?? 'error'
    const duration = opts?.duration ?? TOAST_DURATION
    // Dedupe: never stack an identical message that's already visible (also
    // collapses StrictMode double-fires, since queued functional updates see
    // each other's results).
    setToasts(prev => (prev.some(t => t.message === message) ? prev : [...prev, { id, message, variant, onClick: opts?.onClick, duration }]))
    scheduleDismiss(id, duration)
  }, [scheduleDismiss])

  // Stable value so useToast consumers don't re-render on toast state changes;
  // children bail out via referential equality (the app doesn't re-render).
  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          {toasts.map(t => (
            <div
              key={t.id}
              onMouseEnter={() => pauseDismiss(t.id)}
              onMouseLeave={() => scheduleDismiss(t.id, t.duration)}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg bg-secondary border text-sm shadow-xl animate-in ${t.variant === 'info' ? 'border-cyan-500/30 text-gray-200' : 'border-red-500/30 text-red-400'}`}
            >
              {t.onClick ? (
                <button
                  onClick={() => { t.onClick!(); dismiss(t.id) }}
                  className="flex-1 text-left hover:underline cursor-pointer"
                >
                  {t.message}
                </button>
              ) : (
                <span className="flex-1">{t.message}</span>
              )}
              <button
                onClick={() => dismiss(t.id)}
                className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider (same pattern as AuthContext)
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
