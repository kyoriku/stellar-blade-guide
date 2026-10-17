import { useEffect, useId, useRef, useState } from 'react'
import type { PointerEvent, MouseEvent, RefObject } from 'react'
import { CheckCheck, Trash2, X } from 'lucide-react'
import BusyLabel from './BusyLabel'
import { BULK_COPY } from '../constants/bulkProgressCopy'
import type { Scope } from '../constants/bulkProgressCopy'
import { confirmWordMatches } from '../utils/bulkProgress'
import type { BulkAction } from '../services/api'

interface Props {
  action: BulkAction
  quantity: number // the preview's count, in the Progress page's unit
  scope: Scope
  // Part of the scope is already in the target state, so the opposite action
  // afterwards would not put things back.
  mixed: boolean
  requireWord: boolean
  pending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
  // The browser closed the dialog on its own, even mid-write: Chrome's close
  // watcher can, on an Escape or back gesture after a refused one.
  onForcedClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}

// A native modal <dialog>: showModal() makes the page behind it inert and gives
// Escape for free, and the top layer keeps it clear of any transformed ancestor.
// ConfirmModal is left alone because comment delete relies on it.
export default function BulkProgressDialog({
  action,
  quantity,
  scope,
  mixed,
  requireWord,
  pending,
  error,
  onConfirm,
  onCancel,
  onForcedClose,
  returnFocusRef,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const pressedOutside = useRef(false)
  const [word, setWord] = useState('')
  const titleId = useId()
  const bodyId = useId()
  const inputId = useId()

  useEffect(() => {
    // Read once: React clears refs before passive cleanups run.
    const dialog = ref.current
    const returnTo = returnFocusRef.current
    if (!dialog) return
    // Guarded because StrictMode runs this twice in dev, closing in between.
    if (!dialog.open) dialog.showModal()
    ;(requireWord ? inputRef.current : cancelRef.current)?.focus()
    // Written only while mounted, as ConfirmModal does: the nav drawer is the
    // other writer and there is no count.
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
      if (dialog.open) dialog.close()
      // After close(): the trigger cannot take focus while the modal is open.
      returnTo?.focus()
    }
  }, [requireWord, returnFocusRef])

  const canConfirm = !pending && (!requireWord || confirmWordMatches(word, BULK_COPY.confirmWord))
  const requestClose = () => {
    // Not mid-write: a closed dialog would hide a change still landing. Only the
    // browser's own forced close gets past this, and the section then shows it.
    if (!pending) onCancel()
  }

  // Outside the dialog's own box is the backdrop. The target alone is not enough:
  // clicks on the dialog's scrollbar, and a text selection released over the
  // backdrop, target the dialog element too.
  const outside = (e: PointerEvent | MouseEvent) => {
    const box = ref.current?.getBoundingClientRect()
    return !!box && (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom)
  }

  const clearing = action === 'clear'
  const formatted = quantity.toLocaleString()
  const Icon = clearing ? Trash2 : CheckCheck

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      // No closedby="none" while pending: it would also stop Android's back gesture
      // closing the dialog, and send it back a page mid-write instead.
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
        // A backdrop click targets the dialog itself. A keyboard confirm arrives as
        // a click at 0,0 on its button, which is "outside" too, and a press with no
        // click (a right-click, a cancelled touch) leaves the flag set.
        if (e.target === e.currentTarget && pressedOutside.current && outside(e)) requestClose()
        pressedOutside.current = false
      }}
      // Preflight zeroes the UA's margin: auto, so the margins centre it. Below sm
      // the word dialog is pinned near the top instead (mobile first): centred, its
      // input would sit under the iOS keyboard. The UA colours dialog text black,
      // and a modal dialog given position: relative would lay out off-screen.
      className={`mx-auto ${requireWord ? 'mt-4 mb-auto sm:my-auto' : 'my-auto'} w-[calc(100%-2rem)] max-w-sm max-h-[calc(100svh-2rem)] overflow-y-auto overscroll-contain p-0 scheme-dark text-gray-100 bg-secondary border border-gray-700 rounded-xl shadow-2xl backdrop:bg-[rgba(0,0,0,0.6)] backdrop:backdrop-blur-[8px]`}
    >
      <div className="relative p-4 sm:p-6">
        <form
          onSubmit={e => {
            e.preventDefault()
            if (!canConfirm) return
            // Keeps focus in the dialog and closes a phone keyboard, so the result shows.
            confirmRef.current?.focus()
            onConfirm()
          }}
        >
          <div className="flex items-center gap-2 mb-2 pr-8">
            <Icon className={`w-5 h-5 shrink-0 ${clearing ? 'text-red-400' : 'text-cyan-400'}`} aria-hidden />
            <h2 id={titleId} className="text-base font-semibold text-white">
              {clearing ? BULK_COPY.dialogTitleClear : BULK_COPY.dialogTitleMarkFound}
            </h2>
          </div>
          <p id={bodyId} className="text-sm text-gray-400">
            {clearing
              ? BULK_COPY.dialogBodyClear(quantity, formatted, scope, mixed)
              : BULK_COPY.dialogBodyMarkFound(quantity, formatted, scope, mixed)}
          </p>
          <span className="sr-only" aria-live="polite">{pending ? BULK_COPY.applying : ''}</span>

          {error && (
            <div role="alert" className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {requireWord && (
            <div className="mt-4">
              <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5">
                {BULK_COPY.confirmWordLabel(BULK_COPY.confirmWord)}
              </label>
              <input
                id={inputId}
                ref={inputRef}
                type="text"
                value={word}
                onChange={e => setWord(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                enterKeyHint="go"
                // 16px: anything smaller zooms the page on focus in iOS Safari.
                // outline-hidden, not outline-none: forced colors still draws it.
                className={`w-full px-3.5 py-2.5 rounded-lg bg-primary border border-gray-700 text-white text-base focus:outline-hidden focus:ring-1 transition-colors ${clearing
                  ? 'focus:border-red-500 focus:ring-red-500/30'
                  : 'focus:border-cyan-500/50 focus:ring-cyan-500/50'}`}
              />
            </div>
          )}

          {/* Stacked full width on phones, confirm on top: a counted label does not
              fit beside Cancel at 320px, and wrapping left both buttons ragged. */}
          <div className="flex flex-col-reverse gap-3 mt-6 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={requestClose}
              aria-disabled={pending}
              className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
            >
              {BULK_COPY.cancel}
            </button>
            <button
              ref={confirmRef}
              type="submit"
              // aria-disabled, not disabled: a disabled button drops focus to <body>.
              // While saving it is busy rather than disabled, so it does not dim.
              aria-disabled={!pending && !canConfirm}
              aria-busy={pending}
              className={clearing
                ? 'flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 transition-all duration-200 cursor-pointer aria-busy:cursor-progress aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-red-500/10 aria-disabled:hover:border-red-500/30'
                : 'flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-black transition-all duration-200 cursor-pointer aria-busy:cursor-progress aria-disabled:bg-cyan-500/50 aria-disabled:hover:bg-cyan-500/50 aria-disabled:cursor-not-allowed'}
            >
              <BusyLabel
                label={clearing ? BULK_COPY.confirmClear(formatted) : BULK_COPY.confirmMarkFound(formatted)}
                busy={pending ? BULK_COPY.applying : null}
                variants={[BULK_COPY.applying]}
              />
            </button>
          </div>
        </form>

        {/* Last in the markup so focus order ends on it; positioned top right. */}
        <button
          type="button"
          onClick={requestClose}
          aria-label={BULK_COPY.close}
          aria-disabled={pending}
          className="absolute top-3 right-3 p-1.5 rounded text-gray-500 hover:text-gray-300 transition-colors cursor-pointer aria-disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </dialog>
  )
}
