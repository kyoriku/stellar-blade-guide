import { ADMIN_COPY } from '../constants/adminCopy'
import { ApiError, NETWORK_ERROR_MESSAGE } from '../services/api'

// Pure logic for the admin page (rendering lives in pages/AdminPage.tsx and
// components/admin/). Types are structural, so this file needs nothing from the hook.

// The server's search field takes at most 255 characters and answers more with a
// 422. Nothing that long can match: usernames hold 50 and addresses 255, so the
// hook answers it with an empty list instead of an error.
export const ADMIN_SEARCH_MAX = 255

export function searchTooLong(term: string): boolean {
  // Code points, as the server counts.
  return [...term].length > ADMIN_SEARCH_MAX
}

export type RowAction = 'promote' | 'demote' | 'deactivate' | 'reactivate' | 'delete'

// Admin accounts, the caller's own included, can't be changed from the page: the
// server refuses them on every route, so they get no actions and no Reveal.
export function canChange(row: { role: string }): boolean {
  return row.role !== 'admin'
}

// The pill beside a username: moderator or admin, and nothing for a user. Roles
// arrive as stored, and admins are made by hand in SQL, so anything else (a typo)
// gets no pill rather than a wrong one, and its menu offers Make moderator.
export function rolePill(role: string): 'moderator' | 'admin' | null {
  return role === 'moderator' || role === 'admin' ? role : null
}

// The row menu's items, in its order: the role change, the status change, then
// Delete (after a separator).
export function rowActions(row: { role: string; is_active: boolean }): RowAction[] {
  if (!canChange(row)) return []
  return [row.role === 'moderator' ? 'demote' : 'promote', row.is_active ? 'deactivate' : 'reactivate', 'delete']
}

// A changed row replaces its old self in place. A row the list doesn't hold is
// left out rather than added: it may not match the current search. The same array
// comes back when nothing changed, so TanStack has nothing to notify.
export function replaceRow<T extends { id: number }>(rows: T[] | undefined, row: T): T[] | undefined {
  if (!rows || !rows.some(r => r.id === row.id)) return rows
  return rows.map(r => (r.id === row.id ? row : r))
}

export function removeRow<T extends { id: number }>(rows: T[] | undefined, id: number): T[] | undefined {
  if (!rows || !rows.some(r => r.id === id)) return rows
  return rows.filter(r => r.id !== id)
}

// The join date in the viewer's own locale and time zone, as the Progress page's
// "Member since" is: "Oct 31, 2026" in en-US. The locale and zone are parameters
// only so the tests can pin them.
export function joinedDate(iso: string, locale?: string, timeZone?: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone })
}

// The same day as <time datetime> takes it, YYYY-MM-DD, so the two never disagree.
export function joinedDateTime(iso: string, timeZone?: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone })
    .formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

// The status line above the list.
export function listStatus({ loaded, searching, term, count }: {
  loaded: boolean // a list has arrived, even one for an older search
  searching: boolean // a newer search is debouncing or loading
  term: string // the search the list answers, trimmed
  count: number
}): string {
  if (!loaded) return ADMIN_COPY.loading
  if (searching) return ADMIN_COPY.searching
  const formatted = count.toLocaleString()
  if (!term) return ADMIN_COPY.accounts(count, formatted)
  return count === 0 ? ADMIN_COPY.noMatches : ADMIN_COPY.accountsMatch(count, formatted)
}

export type AdminStep = 'load' | 'reveal' | 'role' | 'status' | 'delete'

const FALLBACK: Record<AdminStep, string> = {
  load: ADMIN_COPY.loadError,
  reveal: ADMIN_COPY.revealError,
  role: ADMIN_COPY.roleError,
  status: ADMIN_COPY.statusError,
  delete: ADMIN_COPY.deleteError,
}

export function adminErrorMessage(err: unknown, step: AdminStep): string {
  // Every admin call has a deadline (hooks/useAdminUsers.ts).
  if (err instanceof DOMException && err.name === 'TimeoutError') return ADMIN_COPY.timeout
  if (err instanceof ApiError) {
    // The server's own words: "Admin accounts can't be changed here.", or a lost role's
    // "Insufficient permissions", which the session refresh then turns into the 404.
    if (err.status === 403) return err.message || FALLBACK[step]
    // A row action's account is gone. The list itself has no "gone".
    if (err.status === 404 && step !== 'load') return ADMIN_COPY.gone
    // The rate limit keeps the site's sentence (readError's), as the bulk card does.
    if (err.status === 429) return err.message
    return FALLBACK[step]
  }
  // fetch rejects with a TypeError when offline; that keeps the site's sentence too.
  if (err instanceof TypeError) return NETWORK_ERROR_MESSAGE
  return FALLBACK[step]
}

// Where a long address may break: after the @, or before a dot, never inside a word.
// The local part is split before each dot; the domain likewise, and the page sets it
// as one inline-block, so it stays whole whenever it fits on a line. A piece longer
// than a line is left to overflow-wrap. domain is null for text with no @ (a masked
// "***"), and empty for one that ends at its @.
export interface EmailParts {
  local: string[]
  domain: string[] | null
}

const beforeDots = (text: string) => text.split(/(?=\.)/).filter(part => part !== '')

export function emailBreakParts(address: string): EmailParts {
  // The last @: a quoted local part can hold one, a domain never does.
  const at = address.lastIndexOf('@')
  if (at < 0) return { local: beforeDots(address), domain: null }
  return { local: beforeDots(address.slice(0, at)), domain: beforeDots(address.slice(at + 1)) }
}
