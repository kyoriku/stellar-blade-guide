import { useEffect, useId, useRef } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { Trash2, X } from 'lucide-react'
import BusyLabel from './BusyLabel'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  busyLabel?: string
  onConfirm: () => void
  onCancel: () => void
  // The browser closed the dialog on its own, even mid-action: Chrome's close
  // watcher can, on an Escape or back gesture after a refused one.
  onForcedClose: () => void
  // Runs once the dialog has closed and left the top layer, whatever closed it, so
  // focus can move. Where it goes depends on the outcome, which only the caller knows.
  onClosed: () => void
  isLoading?: boolean
  error?: string | null
}

// A native modal <dialog>, on BulkProgressDialog's pattern: showModal() makes the
// page behind it inert and gives Escape for free, and every way out is refused
// while the action runs. Mount it only while open: Comment is recursive, so every
// comment and reply on a page has one, and a closed one must touch nothing, least
// of all the body scroll lock (Navbar.tsx and BulkProgressDialog are the other writers).
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  busyLabel = 'Deleting…',
  onConfirm,
  onCancel,
  onForcedClose,
  onClosed,
  isLoading = false,
  error = null,
}: ConfirmModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const pressedOutside = useRef(false)
  // The close below calls the latest onClosed, not the one it was opened with.
  const onClosedRef = useRef(onClosed)
  useEffect(() => { onClosedRef.current = onClosed })
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    // Read once: React clears refs before passive cleanups run.
    const dialog = ref.current
    if (!dialog) return
    // Guarded because StrictMode runs this twice in dev, closing in between.
    if (!dialog.open) dialog.showModal()
    cancelRef.current?.focus()
    // Written only while mounted, as BulkProgressDialog does: there is no count.
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
      if (dialog.open) dialog.close()
      // After close(): nothing behind the modal can take focus while it is open.
      onClosedRef.current()
    }
  }, [])

  const requestClose = () => {
    // Not mid-action: a closed dialog would hide a change still landing. Only the
    // browser's own forced close gets past this, and the caller then shows it.
    if (!isLoading) onCancel()
  }

  // Outside the dialog's own box is the backdrop. The target alone is not enough:
  // clicks on the dialog's scrollbar, and a text selection released over the
  // backdrop, target the dialog element too.
  const outside = (e: PointerEvent | MouseEvent) => {
    const box = ref.current?.getBoundingClientRect()
    return !!box && (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom)
  }

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      // No closedby="none" while busy: it would also stop Android's back gesture
      // closing the dialog, and send it back a page mid-action instead.
      onCancel={e => {
        e.preventDefault()
        requestClose()
      }}
      onClose={() => {
        // StrictMode's replayed mount closes and reopens the dialog; the close
        // event from the first close arrives after it is open again.
        if (ref.current?.open) return
        onForcedClose()
      }}
      onPointerDown={e => { pressedOutside.current = outside(e) }}
      onClick={e => {
        // A backdrop click targets the dialog itself. A keyboard press arrives as a
        // click at 0,0 on its button, which is "outside" too, and a press with no
        // click (a right-click, a cancelled touch) leaves the flag set.
        if (e.target === e.currentTarget && pressedOutside.current && outside(e)) requestClose()
        pressedOutside.current = false
      }}
      // Preflight zeroes the UA's margin: auto, so the margins centre it. The UA
      // colours dialog text black. The backdrop takes literal values, as on
      // BulkProgressDialog: not every browser lets ::backdrop see :root's variables.
      // overscroll-none, not contain: contain rubber-bands the content on macOS even
      // when nothing overflows, and either keeps the page behind from scrolling.
      className="m-auto w-[calc(100%-2rem)] max-w-sm max-h-[calc(100svh-2rem)] overflow-y-auto overscroll-none p-0 scheme-dark text-gray-100 bg-secondary border border-gray-700 rounded-xl shadow-2xl backdrop:bg-[rgba(0,0,0,0.6)] backdrop:backdrop-blur-[8px]"
    >
      <div className="relative p-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>

        <h2 id={titleId} className="text-base font-semibold text-white mb-1">{title}</h2>
        <p id={bodyId} className="text-sm text-gray-400 mb-6">{message}</p>
        <span className="sr-only" aria-live="polite">{isLoading ? busyLabel : ''}</span>

        {error && (
          <div role="alert" className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={requestClose}
            // aria-disabled, not disabled: a disabled button drops focus to <body>.
            aria-disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { if (!isLoading) onConfirm() }}
            // Busy rather than disabled while it runs, so it keeps focus and does not dim.
            aria-busy={isLoading}
            className="flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 transition-all duration-200 cursor-pointer aria-busy:cursor-progress"
          >
            <BusyLabel
              label={confirmLabel}
              busy={isLoading ? busyLabel : null}
              variants={[busyLabel]}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            />
          </button>
        </div>

        {/* Last in the markup so focus order ends on it; positioned top right. */}
        <button
          type="button"
          onClick={requestClose}
          aria-label="Close"
          aria-disabled={isLoading}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer aria-disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </dialog>
  )
}
