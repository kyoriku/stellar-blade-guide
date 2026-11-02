import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Search, Users, UserX, X } from 'lucide-react'
import SEO from '../components/SEO'
import ConfirmModal from '../components/ConfirmModal'
import BusyLabel from '../components/BusyLabel'
import AdminUserRow from '../components/admin/AdminUserRow'
import { useAuth } from '../hooks/useAuth'
import { useAdminUsers } from '../hooks/useAdminUsers'
import type { AdminUser } from '../hooks/useAdminUsers'
import { useToast } from '../context/ToastContext'
import { ADMIN_COPY } from '../constants/adminCopy'
import seo from '../constants/seo.json'
import { adminErrorMessage, listStatus } from '../utils/adminUsers'
import type { RowAction } from '../utils/adminUsers'
import { focusLeftNowhere } from '../utils/focus'

type DialogKind = 'delete' | 'deactivate'

interface DialogState {
  kind: DialogKind
  user: AdminUser
}

// What a dialog's success shows once the dialog has closed: while the modal is
// open, a toast would sit under its backdrop and the page's live region is inert.
interface AfterClose {
  toast?: string
  announce?: string
}

// The same object back when there is nothing to remove, so React has nothing to render.
function withoutKey<K, V>(map: ReadonlyMap<K, V>, key: K): ReadonlyMap<K, V> {
  if (!map.has(key)) return map
  const next = new Map(map)
  next.delete(key)
  return next
}

function withItem<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> {
  return set.has(item) ? set : new Set(set).add(item)
}

function withoutItem<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> {
  if (!set.has(item)) return set
  const next = new Set(set)
  next.delete(item)
  return next
}

// A row's "…" button (RowActionsMenu) and the row itself, found by account id: the
// row may have re-rendered since the dialog opened.
const triggerFor = (id: number) => document.querySelector<HTMLElement>(`[data-admin-actions="${id}"]`)
const rowFor = (id: number) => document.querySelector<HTMLElement>(`[data-admin-row="${id}"]`)

// /admin, for admins only (ProtectedRoute's adminOnly; the server checks every
// request). Every account, newest first, searchable; addresses stay masked until
// revealed one at a time, and a revealed one stays until Hide, leaving the page or
// signing out, since it lives only in this component's state.
export default function AdminPage() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const { list, term, searching, setRole, setActive, deleteUser, revealEmail } = useAdminUsers(search)

  const [revealed, setRevealed] = useState<ReadonlyMap<number, string>>(() => new Map())
  const [revealing, setRevealing] = useState<ReadonlySet<number>>(() => new Set())
  // The accounts with an action running.
  const [busy, setBusy] = useState<ReadonlySet<number>>(() => new Set())
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  // The polite live region: a reveal's address, a role change's or a status change's
  // progress and result, and a failed retry.
  const [announcement, setAnnouncementText] = useState('')
  // The account whose revealed address the live region holds, if it holds one: the
  // address leaves the page when its reveal ends (Hide, or a delete), and so leaves
  // the live region then too.
  const announcedAddressOf = useRef<number | null>(null)
  const setAnnouncement = useCallback((text: string, addressOf: number | null = null) => {
    announcedAddressOf.current = addressOf
    setAnnouncementText(text)
  }, [])
  // The load error a retry is answering. TanStack puts a failed query with no data
  // back to pending the moment it refetches, which would take the error box away,
  // and the focused Try again with it; the box stays until the retry lands instead.
  const [retryingAfter, setRetryingAfter] = useState<Error | null>(null)
  const retrying = useRef(false)
  const tryAgainRef = useRef<HTMLButtonElement>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  // Read synchronously, so a second press before the re-render is refused.
  const busyIds = useRef(new Set<number>())
  const revealingIds = useRef(new Set<number>())
  // The dialog open now, read when its action settles: the browser may have closed it.
  const openDialogRef = useRef<DialogState | null>(null)
  // The dialog opened last, read once it has closed, to move focus.
  const lastDialogRef = useRef<DialogState | null>(null)
  // The account that dialog deleted, if it did.
  const deletedId = useRef<number | null>(null)
  const afterClose = useRef<AfterClose | null>(null)

  const headingId = useId()
  const searchId = useId()

  const markBusy = useCallback((id: number, on: boolean) => {
    if (on) busyIds.current.add(id)
    else busyIds.current.delete(id)
    setBusy(prev => (on ? withItem(prev, id) : withoutItem(prev, id)))
  }, [])

  // After a delete, focus goes to the Users heading, but only when the delete left it
  // nowhere, or in the row it takes away: anyone who moved on meanwhile keeps their
  // place. preventScroll: the heading can be a long way up the list.
  const focusHeadingIfLost = useCallback((id: number) => {
    if (focusLeftNowhere(rowFor(id))) headingRef.current?.focus({ preventScroll: true })
  }, [])

  const onReveal = useCallback((id: number) => {
    if (revealingIds.current.has(id)) return
    revealingIds.current.add(id)
    setRevealing(prev => withItem(prev, id))
    // The eye shows a spinner while the address loads, and this reads it out. It also
    // replaces an address read out before, so the same address is read out again.
    setAnnouncement(ADMIN_COPY.revealing)
    void revealEmail(id)
      .then(email => {
        setRevealed(prev => new Map(prev).set(id, email))
        // Focus stays on the button, and only its name changes, so the address is
        // read out here.
        setAnnouncement(email, id)
      })
      .catch((err: unknown) => {
        setAnnouncement('')
        showToast(adminErrorMessage(err, 'reveal'))
      })
      .finally(() => {
        revealingIds.current.delete(id)
        setRevealing(prev => withoutItem(prev, id))
      })
  }, [revealEmail, setAnnouncement, showToast])

  // Hide, and a delete: the address leaves the row, and the live region if it is there.
  const onHide = useCallback((id: number) => {
    setRevealed(prev => withoutKey(prev, id))
    if (announcedAddressOf.current === id) setAnnouncement('')
  }, [setAnnouncement])

  // A role change and a reactivation run at once: the row's button shows busy, and
  // the live region reads "Saving…" and then the result. A failure is a toast.
  const runNow = useCallback(async (target: AdminUser, action: 'promote' | 'demote' | 'reactivate') => {
    if (busyIds.current.has(target.id)) return
    markBusy(target.id, true)
    setAnnouncement(ADMIN_COPY.saving)
    try {
      if (action === 'reactivate') {
        const row = await setActive(target.id, true)
        setAnnouncement(ADMIN_COPY.activeAgain(row.username))
      } else {
        const row = await setRole(target.id, action === 'promote' ? 'moderator' : 'user')
        setAnnouncement(row.role === 'moderator' ? ADMIN_COPY.nowModerator(row.username) : ADMIN_COPY.noLongerModerator(row.username))
      }
    } catch (err) {
      setAnnouncement('')
      showToast(adminErrorMessage(err, action === 'reactivate' ? 'status' : 'role'))
    } finally {
      markBusy(target.id, false)
    }
  }, [markBusy, setActive, setAnnouncement, setRole, showToast])

  const openDialog = useCallback((kind: DialogKind, target: AdminUser) => {
    if (busyIds.current.has(target.id)) return
    const next = { kind, user: target }
    openDialogRef.current = next
    lastDialogRef.current = next
    deletedId.current = null
    afterClose.current = null
    setDialogError(null)
    setDialog(next)
  }, [])

  const onAction = useCallback((action: RowAction, target: AdminUser) => {
    if (action === 'deactivate' || action === 'delete') openDialog(action, target)
    else void runNow(target, action)
  }, [openDialog, runNow])

  const closeDialog = useCallback(() => {
    openDialogRef.current = null
    setDialogError(null)
    setDialog(null)
  }, [])

  // The browser closed the dialog on its own: its action, if one is out, carries on,
  // the row's button shows it, and the live region reads it out.
  const onForcedClose = useCallback(() => {
    const open = openDialogRef.current
    closeDialog()
    if (open && busyIds.current.has(open.user.id)) {
      setAnnouncement(open.kind === 'delete' ? ADMIN_COPY.deleting : ADMIN_COPY.deactivating)
    }
  }, [closeDialog, setAnnouncement])

  const confirmDialog = useCallback(async () => {
    const snapshot = openDialogRef.current
    if (!snapshot || busyIds.current.has(snapshot.user.id)) return
    const { kind, user: target } = snapshot
    const stillOpen = () => openDialogRef.current === snapshot
    markBusy(target.id, true)
    setDialogError(null)
    try {
      if (kind === 'delete') {
        await deleteUser(target.id)
        onHide(target.id)
        const toast = ADMIN_COPY.deleted(target.username)
        if (stillOpen()) {
          deletedId.current = target.id
          afterClose.current = { toast }
          closeDialog()
        } else {
          // The browser closed the dialog mid-delete; the result still shows.
          showToast(toast, { variant: 'info' })
          focusHeadingIfLost(target.id)
        }
      } else {
        const row = await setActive(target.id, false)
        const announce = ADMIN_COPY.isDeactivated(row.username)
        if (stillOpen()) {
          afterClose.current = { announce }
          closeDialog()
        } else {
          setAnnouncement(announce)
        }
      }
    } catch (err) {
      const text = adminErrorMessage(err, kind === 'delete' ? 'delete' : 'status')
      // An open dialog keeps its own error; one the browser closed mid-action cannot.
      if (stillOpen()) {
        setDialogError(text)
      } else {
        setAnnouncement('')
        showToast(text)
      }
    } finally {
      markBusy(target.id, false)
    }
  }, [closeDialog, deleteUser, focusHeadingIfLost, markBusy, onHide, setActive, setAnnouncement, showToast])

  // Focus follows the outcome: the Users heading after a delete, otherwise the "…"
  // button that opened the dialog, or the heading if that row has gone meanwhile.
  const onDialogClosed = useCallback(() => {
    const last = lastDialogRef.current
    if (!last) return
    const trigger = triggerFor(last.user.id)
    if (deletedId.current === last.user.id || !trigger) focusHeadingIfLost(last.user.id)
    else trigger.focus()
  }, [focusHeadingIfLost])

  useEffect(() => {
    if (dialog || !afterClose.current) return
    const { toast, announce } = afterClose.current
    afterClose.current = null
    if (toast) showToast(toast, { variant: 'info' })
    if (announce) setAnnouncement(announce)
  }, [dialog, setAnnouncement, showToast])

  // Try again: the button shows the retry, and keeps focus, and the live region reads
  // "Loading accounts…". A retry that fails with the same words leaves the alert
  // unchanged, so the live region says them again (one with new words is read out by
  // the alert itself). One that loads the list takes the box away, and focus goes to
  // the Users heading, as after a delete.
  const retryList = async () => {
    // A second press mid-retry would copy the error TanStack holds while pending,
    // null, and take the box away with the focused button in it.
    if (retrying.current) return
    retrying.current = true
    const shown = adminErrorMessage(list.error, 'load')
    setRetryingAfter(list.error)
    setAnnouncement(ADMIN_COPY.loading)
    const result = await list.refetch()
    retrying.current = false
    setRetryingAfter(null)
    if (result.isError) {
      const message = adminErrorMessage(result.error, 'load')
      setAnnouncement(message === shown ? message : '')
      return
    }
    setAnnouncement('')
    // Read before the re-render takes the box away: anyone who moved on meanwhile
    // keeps their place.
    if (focusLeftNowhere(tryAgainRef.current)) headingRef.current?.focus({ preventScroll: true })
  }

  const users = list.data
  const loadError = list.isError ? list.error : retryingAfter
  const status = listStatus({ loaded: users !== undefined, searching, term, count: users?.length ?? 0 })
  const [confirmBefore, confirmAfter] = ADMIN_COPY.deleteConfirmAround

  return (
    <div className="flex-1 bg-primary pt-12 px-4">
      {/* The tab title is the menu label; the h1 carries the fuller name, as on
          Settings and Progress. */}
      <SEO title={seo.noindex['/admin'].title} description={seo.noindex['/admin'].description} noindex />

      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">{ADMIN_COPY.pageHeading}</h1>

        {/* Settings' card, padded as the legal pages are: 16px on phones gives the
            rows more width. */}
        <section className="bg-secondary border border-gray-800 rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-cyan-400" />
            {/* Focus lands here after a delete takes away the row that had it. */}
            <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-lg font-semibold text-gray-100">
              {ADMIN_COPY.usersHeading}
            </h2>
          </div>
          <p className="text-sm text-gray-400 mb-6">{ADMIN_COPY.description}</p>

          <label htmlFor={searchId} className="sr-only">{ADMIN_COPY.searchLabel}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              id={searchId}
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={ADMIN_COPY.searchPlaceholder}
              // Usernames and addresses: nothing to capitalize, correct or fill in.
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              enterKeyHint="search"
              // outline-hidden, not outline-none: forced colors still draws it. Touch
              // screens get 16px from index.css, so iOS doesn't zoom. Room on the right
              // for Clear search only while it shows, so the placeholder gets it on phones.
              className={`w-full pl-9 ${search ? 'pr-9' : 'pr-3'} py-2.5 rounded-lg bg-primary border border-gray-700 text-white placeholder-gray-400 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors text-sm`}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  searchRef.current?.focus()
                }}
                aria-label={ADMIN_COPY.clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loadError ? (
            <div role="alert" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {adminErrorMessage(loadError, 'load')}
              <button
                ref={tryAgainRef}
                type="button"
                onClick={() => void retryList()}
                // Busy rather than disabled while it runs, so it keeps focus.
                aria-busy={retryingAfter !== null}
                className="text-cyan-400 underline decoration-cyan-400/50 underline-offset-2 hover:decoration-cyan-400 cursor-pointer aria-busy:no-underline aria-busy:cursor-progress"
              >
                <BusyLabel label={ADMIN_COPY.tryAgain} busy={retryingAfter !== null} />
              </button>
            </div>
          ) : (
            <>
              {/* Polite, so a search's count is read out when it lands. */}
              <p aria-live="polite" className="mt-3 mb-2 text-xs text-gray-400">{status}</p>

              {users && users.length > 0 && (
                // Divs with table roles, so rows can stack below lg and keep their
                // headers. From lg a subgrid lines the four columns up under the header.
                <div role="table" aria-labelledby={headingId} className="lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:gap-x-6">
                  {/* Read out at every width; shown only from lg. */}
                  <div role="row" className="max-lg:sr-only lg:col-span-full lg:grid lg:grid-cols-subgrid lg:pb-2 text-xs font-medium text-gray-400">
                    <div role="columnheader">{ADMIN_COPY.columnAccount}</div>
                    <div role="columnheader">{ADMIN_COPY.columnStatus}</div>
                    <div role="columnheader">{ADMIN_COPY.columnJoined}</div>
                    <div role="columnheader"><span className="sr-only">{ADMIN_COPY.columnActions}</span></div>
                  </div>
                  {users.map(u => (
                    <AdminUserRow
                      key={u.id}
                      user={u}
                      self={u.id === me?.id}
                      email={revealed.get(u.id)}
                      revealing={revealing.has(u.id)}
                      busy={busy.has(u.id)}
                      onReveal={onReveal}
                      onHide={onHide}
                      onAction={onAction}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Outside the dialog, so it is live again the moment the dialog closes. */}
      <span className="sr-only" aria-live="polite">{announcement}</span>

      {dialog && (dialog.kind === 'delete' ? (
        <ConfirmModal
          key={`delete-${dialog.user.id}`}
          title={ADMIN_COPY.deleteTitle}
          message={ADMIN_COPY.deleteBody(dialog.user.username)}
          confirmLabel={ADMIN_COPY.delete}
          busyLabel={ADMIN_COPY.deleting}
          confirmText={{
            expected: dialog.user.username,
            label: <>{confirmBefore}<span className="text-white font-mono">{dialog.user.username}</span>{confirmAfter}</>,
          }}
          onConfirm={() => void confirmDialog()}
          onCancel={closeDialog}
          onForcedClose={onForcedClose}
          onClosed={onDialogClosed}
          isLoading={busy.has(dialog.user.id)}
          error={dialogError}
        />
      ) : (
        <ConfirmModal
          key={`deactivate-${dialog.user.id}`}
          title={ADMIN_COPY.deactivateTitle}
          message={ADMIN_COPY.deactivateBody(dialog.user.username)}
          confirmLabel={ADMIN_COPY.deactivate}
          busyLabel={ADMIN_COPY.deactivating}
          icon={UserX}
          onConfirm={() => void confirmDialog()}
          onCancel={closeDialog}
          onForcedClose={onForcedClose}
          onClosed={onDialogClosed}
          isLoading={busy.has(dialog.user.id)}
          error={dialogError}
        />
      ))}
    </div>
  )
}
