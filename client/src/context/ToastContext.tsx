import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// Lightweight toast for background/optimistic failures that have no natural
// inline place to show an error (progress toggle/load, guest-sync, walkthrough
// nav). Surfaces a self-dismissing notice; never blocks the UI.

interface Toast {
  id: number
  message: string
}

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string) => {
    const id = nextId.current++
    // Dedupe: never stack an identical message that's already visible (also
    // collapses StrictMode double-fires, since queued functional updates see
    // each other's results).
    setToasts(prev => (prev.some(t => t.message === message) ? prev : [...prev, { id, message }]))
    window.setTimeout(() => dismiss(id), TOAST_DURATION)
  }, [dismiss])

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
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg bg-secondary border border-red-500/30 text-red-400 text-sm shadow-xl animate-in"
            >
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
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
