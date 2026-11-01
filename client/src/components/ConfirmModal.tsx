import { useEffect, useId, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, ReactNode } from 'react'
import { Trash2, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import BusyLabel from './BusyLabel'
import { confirmTextMatches } from '../utils/confirmText'

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
  // Typed mode (the admin page's Delete): a labelled input, which takes focus, and
  // Confirm stays aria-disabled until `expected` is typed exactly (utils/confirmText.ts).
  // The caller writes the label, so it can set the text to type apart.
  confirmText?: { expected: string; label: ReactNode }
  // Stands in for the trash can, in the badge and on Confirm.
  icon?: LucideIcon
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
  confirmText,
  icon: Icon = Trash2,
}: ConfirmModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const pressedOutside = useRef(false)
  const [typed, setTyped] = useState('')
  // The close below calls the latest onClosed, not the one it was opened with.
  const onClosedRef = useRef(onClosed)
  useEffect(() => { onClosedRef.current = onClosed })
  const titleId = useId()
  const bodyId = useId()
  const inputId = useId()
  // Read once: whether the dialog has an input never changes while it is open.
  const typedMode = useRef(confirmText !== undefined)

  useEffect(() => {
    // Read once: React clears refs before passive cleanups run.
    const dialog = ref.current
    if (!dialog) return
    // Guarded because StrictMode runs this twice in dev, closing in between.
    if (!dialog.open) dialog.showModal()
    ;(typedMode.current ? inputRef.current : cancelRef.current)?.focus()
    // Written only while mounted, as BulkProgressDialog does: there is no count.
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
      if (dialog.open) dialog.close()
      // After close(): nothing behind the modal can take focus while it is open.
      onClosedRef.current()
    }
  }, [])

  const canConfirm = !isLoading && (!confirmText || confirmTextMatches(typed, confirmText.expected))

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
      // Preflight zeroes the UA's margin: auto, so the margins centre it. Below sm the
      // typed dialog is pinned near the top instead, as the bulk dialog's word mode is:
      // centred, its input would sit under the iOS keyboard. The UA colours dialog
      // text black. The backdrop takes literal values, as on BulkProgressDialog: not
      // every browser lets ::backdrop see :root's variables. overscroll-none, not
      // contain: contain rubber-bands the content on macOS even when nothing
      // overflows, and either keeps the page behind from scrolling.
      className={`${confirmText ? 'mx-auto mt-4 mb-auto sm:my-auto' : 'm-auto'} w-[calc(100%-2rem)] max-w-sm max-h-[calc(100svh-2rem)] overflow-y-auto overscroll-none p-0 scheme-dark text-gray-100 bg-secondary border border-gray-700 rounded-xl shadow-2xl backdrop:bg-[rgba(0,0,0,0.6)] backdrop:backdrop-blur-[8px]`}
    >
      <div className="relative p-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
          <Icon className="w-5 h-5 text-red-400" />
        </div>

        <h2 id={titleId} className="text-base font-semibold text-white mb-1">{title}</h2>
        {/* wrap-anywhere: a username can run 50 characters with nowhere to break. */}
        <p id={bodyId} className={`text-sm text-gray-400 wrap-anywhere ${confirmText ? 'mb-4' : 'mb-6'}`}>{message}</p>

        {confirmText && (
          // A form only for its Enter, which also waits out an input method's composition.
          <form
            className="mb-6"
            onSubmit={e => {
              e.preventDefault()
              if (!canConfirm) return
              // Keeps focus in the dialog and closes a phone keyboard, so the result shows.
              confirmRef.current?.focus()
              onConfirm()
            }}
          >
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5 wrap-anywhere">
              {confirmText.label}
            </label>
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              readOnly={isLoading}
              // The match is exact, so a phone must not capitalize, correct or fill it.
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              enterKeyHint="go"
              // outline-hidden, not outline-none: forced colors still draws it. Touch
              // screens get 16px from index.css, so iOS doesn't zoom.
              className="w-full px-3.5 py-2.5 rounded-lg bg-primary border border-gray-700 text-white placeholder-gray-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors text-sm"
            />
          </form>
        )}

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
            ref={confirmRef}
            type="button"
            onClick={() => { if (canConfirm) onConfirm() }}
            // Busy rather than disabled while it runs, so it keeps focus and does not dim.
            aria-busy={isLoading}
            // Typed mode only: dimmed, and refused, until the text matches.
            aria-disabled={confirmText ? !isLoading && !canConfirm : undefined}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 transition-all duration-200 cursor-pointer aria-busy:cursor-progress${confirmText ? ' aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-red-500/10 aria-disabled:hover:border-red-500/30' : ''}`}
          >
            <BusyLabel
              label={confirmLabel}
              busy={isLoading ? busyLabel : null}
              variants={[busyLabel]}
              icon={<Icon className="w-3.5 h-3.5" />}
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
