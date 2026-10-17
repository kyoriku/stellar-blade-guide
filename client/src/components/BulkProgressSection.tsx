import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { ChevronDown, ListChecks } from 'lucide-react'
import BulkProgressDialog from './BulkProgressDialog'
import BusyLabel from './BusyLabel'
import { useAuth } from '../hooks/useAuth'
import { useBulkProgress } from '../hooks/useBulkProgress'
import { useToast } from '../context/ToastContext'
import { BULK_COPY } from '../constants/bulkProgressCopy'
import type { Scope } from '../constants/bulkProgressCopy'
import { cycleLabel } from '../constants/cycleLabels'
import { buildRequest, bulkErrorMessage, pickableCycles, scopeForCopy, scopeGroups, scopeOffered, soleCycle } from '../utils/bulkProgress'
import { CYCLE_NAMES } from '../utils/progressRows'
import type { BulkAction, BulkCycle, BulkPreviewResponse, BulkProgressRequest, UserStatsResponse } from '../services/api'

// What the dialog shows is frozen at the press, and Confirm sends exactly this
// request, so the sentence a user confirms is the write that runs.
interface Snapshot {
  req: BulkProgressRequest
  preview: BulkPreviewResponse
  scope: Scope
  action: BulkAction
}

const CYCLE_OPTIONS: { value: BulkCycle | ''; label: string }[] = [
  { value: '', label: BULK_COPY.cycleAll },
  ...CYCLE_NAMES.map(c => ({ value: c as BulkCycle, label: cycleLabel(c) })),
]

// Both busy texts size each action button, so neither press changes its width.
const BUSY_VARIANTS = [BULK_COPY.counting, BULK_COPY.applying] as const

export default function BulkProgressSection({ stats }: { stats?: UserStatsResponse }) {
  const [open, setOpen] = useState(false)
  const [scopeValue, setScopeValue] = useState('')
  const [cycle, setCycle] = useState<BulkCycle | ''>('')
  const [counting, setCounting] = useState<BulkAction | null>(null)
  const [dialog, setDialog] = useState<Snapshot | null>(null)
  const [writeError, setWriteError] = useState<string | null>(null)

  const { preview, apply } = useBulkProgress()
  const { isAuthenticated, accessToken } = useAuth()
  const { showToast } = useToast()
  // Per-item writes count too: the refresh after a bulk write would overwrite the
  // optimistic entry of a tick still in flight.
  const writesPending = useIsMutating({ mutationKey: ['progress'] }) > 0
  // The data hooks' own gate: this page renders during an auth restore and through
  // a transient token drop, when a request would wait on the refresh or 401.
  const ready = isAuthenticated && accessToken !== null
  const busy = counting !== null || writesPending || !ready
  // A write still landing after the browser closed its dialog.
  const saving = apply.isPending && !dialog ? apply.variables?.req.action ?? null : null
  // Counting and saving show in the button that started them.
  const busyText = (action: BulkAction) =>
    counting === action ? BULK_COPY.counting : saving === action ? BULK_COPY.applying : null

  const groups = useMemo(() => scopeGroups(stats), [stats])
  // A scope the loaded rows dropped goes back to "Choose a scope". Not mid-count,
  // like the cycle reset below.
  if (counting === null && scopeValue && !scopeOffered(scopeValue, groups)) setScopeValue('')
  const pickable = useMemo(() => pickableCycles(scopeValue, stats), [scopeValue, stats])
  // A picked cycle this scope cannot be narrowed to goes back to All,
  // whether the scope changed or stats arrived after the pick. Not mid-count:
  // that request is already frozen.
  if (counting === null && cycle && pickable && !pickable.has(cycle)) setCycle('')
  // A single-cycle scope shows its cycle selected, while `cycle` stays All, so
  // the request names none and leaving the scope lands back on All. A
  // pick still set here is a count's frozen one (the reset waits for it), and it
  // stays on screen until that count lands.
  const sole = useMemo(() => soleCycle(scopeValue, stats), [scopeValue, stats])
  const shownCycle = cycle || (sole ?? '')
  const seq = useRef(0)
  const submitting = useRef(false)
  const openSnapshot = useRef<Snapshot | null>(null)
  // A toast shown while the modal is open would sit under its backdrop, dimmed and
  // inert, so a write's result waits here until the dialog has closed.
  const afterClose = useRef<string | null>(null)
  const clearRef = useRef<HTMLButtonElement>(null)
  const markRef = useRef<HTMLButtonElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const cyclesRef = useRef<HTMLFieldSetElement>(null)
  const focusedPill = useRef<HTMLInputElement | null>(null)

  // Disabling the pill under focus (stats arriving after a pick) drops focus to
  // <body>, and React never reports that blur. Hand focus to the row's checked
  // pill if it can take it, else back to Scope.
  useLayoutEffect(() => {
    if (!focusedPill.current?.disabled || document.activeElement !== document.body) return
    focusedPill.current = null
    const checked = cyclesRef.current?.querySelector<HTMLInputElement>('input:checked:enabled')
    ;(checked ?? selectRef.current)?.focus()
  }, [pickable, sole])

  const headingId = useId()
  const panelId = useId()
  const selectId = useId()
  const radioName = useId()

  useEffect(() => {
    if (dialog || afterClose.current === null) return
    showToast(afterClose.current, { variant: 'info' })
    afterClose.current = null
  }, [dialog, showToast])

  const reset = () => {
    seq.current++ // a count still in flight now answers a question nobody asks
  }

  // Results are toasts, so the card never changes height once it is open.
  const start = async (action: BulkAction) => {
    if (busy || dialog) return
    const req = buildRequest(action, scopeValue, cycle)
    if (!req) {
      showToast(BULK_COPY.hintChooseScope, { variant: 'info' })
      return
    }
    const mine = ++seq.current
    const scope = scopeForCopy(scopeValue, groups, cycle)
    setCounting(action)
    try {
      const counted = await preview(req)
      if (mine !== seq.current) return
      if (counted.entries > 0) {
        setWriteError(null)
        const snapshot = { req, preview: counted, scope, action }
        openSnapshot.current = snapshot
        setDialog(snapshot)
      } else if (counted.scope_entries === 0) {
        showToast(BULK_COPY.emptyScope(scope), { variant: 'info' })
      } else {
        showToast(action === 'clear' ? BULK_COPY.nothingToClear(scope) : BULK_COPY.nothingToMark(scope), { variant: 'info' })
      }
    } catch (err) {
      if (mine === seq.current) showToast(bulkErrorMessage(err, 'preview'))
    } finally {
      if (mine === seq.current) setCounting(null)
    }
  }

  const closeDialog = () => {
    openSnapshot.current = null
    setDialog(null)
  }

  const confirm = async () => {
    const snapshot = openSnapshot.current
    if (!snapshot || submitting.current) return
    submitting.current = true
    setWriteError(null)
    const { req, preview: counted, scope, action } = snapshot
    try {
      const result = await apply.mutateAsync({ req, scopeIds: counted.scope_ids })
      const formatted = result.quantity.toLocaleString()
      let text: string
      if (result.entries === 0) {
        // Another tab or device got there first.
        text = action === 'clear' ? BULK_COPY.nothingToClear(scope) : BULK_COPY.nothingToMark(scope)
      } else {
        text = action === 'clear'
          ? BULK_COPY.successClear(result.quantity, formatted, scope)
          : BULK_COPY.successMarkFound(result.quantity, formatted, scope)
      }
      if (openSnapshot.current === snapshot) {
        afterClose.current = text
        closeDialog()
      } else {
        // The browser closed the dialog mid-write; the result still shows.
        showToast(text, { variant: 'info' })
      }
    } catch (err) {
      const text = bulkErrorMessage(err, 'apply')
      // An open dialog keeps its own error; one the browser closed mid-write cannot.
      if (openSnapshot.current === snapshot) setWriteError(text)
      else showToast(text)
    } finally {
      submitting.current = false
    }
  }

  const actionButton = 'flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer aria-busy:cursor-progress aria-disabled:cursor-not-allowed'

  return (
    <section aria-labelledby={headingId} className="bg-secondary border border-gray-800 rounded-xl">
      {/* The toggle sits inside the heading, so the card still turns up in
          heading navigation. */}
      <h2 id={headingId} className="text-lg font-semibold text-gray-100">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(o => !o)}
          className="group w-full flex items-center gap-2 p-6 text-left rounded-xl cursor-pointer"
        >
          <ListChecks className="w-5 h-5 shrink-0 text-cyan-400" aria-hidden />
          {BULK_COPY.heading}
          <ChevronDown
            aria-hidden
            className={`ml-auto w-5 h-5 shrink-0 text-gray-400 group-hover:text-gray-200 transition-transform duration-200${open ? ' rotate-180' : ''}`}
          />
        </button>
      </h2>

      {/* Hidden rather than unmounted while closed, so the picks survive. */}
      <div id={panelId} hidden={!open} className="px-6 pb-6">
        <p className="text-gray-400 text-sm mb-6">{BULK_COPY.description}</p>

        <fieldset disabled={counting !== null} className="space-y-5 disabled:opacity-60">
          <div>
            <label htmlFor={selectId} className="block text-sm font-medium text-gray-300 mb-1.5">
              {BULK_COPY.scopeLabel}
            </label>
            {/* The native arrow sits against the border whatever the padding, so
                the chevron is drawn here, inset like the text. */}
            <div className="relative sm:w-fit sm:min-w-72">
              <select
                ref={selectRef}
                id={selectId}
                value={scopeValue}
                onChange={e => {
                  setScopeValue(e.target.value)
                  reset()
                }}
                // 16px so iOS does not zoom; scheme-dark so the native list is dark too;
                // outline-hidden, not outline-none, so forced colors still shows focus.
                className="w-full appearance-none bg-gray-800/50 border border-gray-700 text-gray-300 text-base rounded-lg pl-3 pr-10 py-2 cursor-pointer scheme-dark focus:outline-hidden focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              >
                <option value="" disabled>{BULK_COPY.scopePlaceholder}</option>
                {groups.map(group => group.label === null
                  ? group.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
                  : (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  ))}
              </select>
              <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <fieldset
            ref={cyclesRef}
            onFocus={e => { if (e.target instanceof HTMLInputElement) focusedPill.current = e.target }}
            // A pill that blurs because it was disabled stays recorded for the
            // focus hand-off above; any other blur means focus moved on.
            onBlur={e => { if (!(e.target instanceof HTMLInputElement && e.target.disabled)) focusedPill.current = null }}
          >
            <legend className="block text-sm font-medium text-gray-300 mb-1.5">{BULK_COPY.cycleLegend}</legend>
            <div className="flex flex-wrap gap-2">
              {CYCLE_OPTIONS.map(o => {
                // A single-cycle scope locks every pill, All included; otherwise
                // a pill is off when it would not narrow the scope. Disabled, not
                // hidden, so the card keeps its height across scopes.
                const disabled = sole !== null || (o.value !== '' && pickable !== null && !pickable.has(o.value))
                const shown = shownCycle === o.value
                return (
                  <label
                    key={o.label}
                    data-off={(disabled && !shown) || undefined}
                    // The site's pill, with real radio semantics. The input covers the pill
                    // (not sr-only) so the touch target matches and focus does not jump.
                    // Focus is an outline, not a ring: forced colors drops box-shadows.
                    // data-off rather than :disabled: the counting fieldset disables every
                    // pill, and a single-cycle scope's own pill stays undimmed. Hover only
                    // brightens a pill that can be picked. In forced colors the checked
                    // pill's 2px border gives back a pixel of padding per side, so the
                    // selection moving never rewraps the row.
                    className="relative px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer bg-gray-800/50 border-gray-700 text-gray-400 has-[:enabled:not(:checked)]:hover:border-gray-600 has-[:enabled:not(:checked)]:hover:text-gray-300 has-[:checked]:bg-cyan-500/20 has-[:checked]:border-cyan-500/50 has-[:checked]:text-cyan-400 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cyan-500/60 forced-colors:has-[:checked]:border-[Highlight] forced-colors:has-[:checked]:border-2 forced-colors:has-[:checked]:px-2.75 forced-colors:has-[:checked]:py-1.25 data-off:opacity-40 data-off:cursor-not-allowed"
                  >
                    <input
                      type="radio"
                      name={radioName}
                      value={o.value}
                      checked={shown}
                      disabled={disabled}
                      onChange={() => {
                        setCycle(o.value)
                        reset()
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {o.label}
                  </label>
                )
              })}
            </div>
          </fieldset>
        </fieldset>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            ref={clearRef}
            type="button"
            onClick={() => void start('clear')}
            // aria-disabled, not disabled: the button keeps focus, and a press while
            // nothing is chosen shows a hint instead of doing nothing. The button
            // counting or saving is busy instead, so it does not dim.
            aria-disabled={busy && !busyText('clear')}
            aria-busy={!!busyText('clear')}
            className={`${actionButton} bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 aria-disabled:opacity-40 aria-disabled:hover:bg-red-500/10 aria-disabled:hover:border-red-500/30`}
          >
            <BusyLabel label={BULK_COPY.clearButton} busy={busyText('clear')} variants={BUSY_VARIANTS} />
          </button>
          <button
            ref={markRef}
            type="button"
            onClick={() => void start('mark_found')}
            aria-disabled={busy && !busyText('mark_found')}
            aria-busy={!!busyText('mark_found')}
            className={`${actionButton} bg-cyan-500 hover:bg-cyan-400 text-black aria-disabled:bg-cyan-500/50 aria-disabled:hover:bg-cyan-500/50`}
          >
            <BusyLabel label={BULK_COPY.markButton} busy={busyText('mark_found')} variants={BUSY_VARIANTS} />
          </button>
        </div>

        {/* The buttons show counting and saving; this reads them out. No
            role="status": the toast container already holds that role. */}
        <span className="sr-only" aria-live="polite">{busyText('clear') ?? busyText('mark_found') ?? ''}</span>
      </div>

      {dialog && (
        <BulkProgressDialog
          action={dialog.action}
          quantity={dialog.preview.quantity}
          scope={dialog.scope}
          mixed={dialog.preview.entries < dialog.preview.scope_entries}
          requireWord={dialog.req.scope === 'everything'}
          pending={apply.isPending}
          error={writeError}
          onConfirm={() => void confirm()}
          onCancel={closeDialog}
          onForcedClose={closeDialog}
          returnFocusRef={dialog.action === 'clear' ? clearRef : markRef}
        />
      )}
    </section>
  )
}
