import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// Lightweight, app-wide toast for feedback that has no inline home: background and
// optimistic failures (progress toggle and load, guest sync, walkthrough nav) and the
// bulk progress card's results. Self-dismissing; never blocks the UI.
//
// The one toast that isn't feedback is the hand-clear tip (hooks/useHandClearTip.ts),
// and it should stay the only one. It alone uses `action`, a link-styled button after
// the message, and `duration: Infinity`, which leaves a toast up until its action or
// Dismiss is pressed: it shows once per browser, to someone whose eyes are on a list.
//
// `onClick` and `action` keep this provider free of the router: it sits outside
// <BrowserRouter>, so callers (which are inside Router) pass a navigate callback
// rather than a route string.

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: number
  message: string
  variant: 'error' | 'info'
  onClick?: () => void
  action?: ToastAction
  duration: number
}

interface ToastOptions {
  variant?: 'error' | 'info'
  onClick?: () => void
  action?: ToastAction
  // Milliseconds on screen; Infinity for no timer.
  duration?: number
}

interface ToastContextValue {
  showToast: (message: string, opts?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// How long a toast stays, by variant. An error stays longer, since it usually
// asks for something to be done.
const TOAST_DURATIONS = { info: 6000, error: 10000 } as const

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Arm (or re-arm) a toast's auto-dismiss timer. Infinity arms none: setTimeout
  // would run an Infinity delay at once.
  const scheduleDismiss = useCallback((id: number, duration: number) => {
    if (duration === Infinity) return
    timers.current.set(id, setTimeout(() => dismiss(id), duration))
  }, [dismiss])

  // Pause auto-dismiss (while hovered) without removing the toast.
  const pauseDismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const showToast = useCallback((message: string, opts?: ToastOptions) => {
    const id = nextId.current++
    const variant = opts?.variant ?? 'error'
    const duration = opts?.duration ?? TOAST_DURATIONS[variant]
    // Dedupe: never stack an identical message that's already visible (also
    // collapses StrictMode double-fires, since queued functional updates see
    // each other's results).
    setToasts(prev => (prev.some(t => t.message === message) ? prev : [...prev, { id, message, variant, onClick: opts?.onClick, action: opts?.action, duration }]))
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
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:w-full sm:max-w-sm z-100 flex flex-col gap-2 pointer-events-none"
          role="status"
          aria-live="polite"
          // A status region is atomic by default, so each new toast would be read
          // after every toast still up, and the tip stays up until dismissed.
          aria-atomic="false"
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
                <span className="flex-1">
                  {t.message}
                  {t.action && (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={() => { t.action!.onClick(); dismiss(t.id) }}
                        className="text-cyan-400 underline decoration-cyan-400/50 underline-offset-2 hover:decoration-cyan-400 cursor-pointer"
                      >
                        {t.action.label}
                      </button>
                    </>
                  )}
                </span>
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

// eslint-disable-next-line react-refresh/only-export-components -- hook deliberately colocated with its provider; the only cost is that edits to this file full-reload instead of fast-refreshing
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
