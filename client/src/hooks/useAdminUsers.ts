import { useCallback, useEffect, useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { NOTIFICATIONS_KEY } from './useNotifications'
import { API_BASE_URL, ApiError, readError } from '../services/api'
import { ADMIN_COPY } from '../constants/adminCopy'
import { removeRow, replaceRow, searchTooLong } from '../utils/adminUsers'

// Mirrors AdminUser in server/app/schemas/admin.py: every list, role and active
// answer is this row. No answer but the reveal ever holds a full address.
export interface AdminUser {
  id: number
  username: string
  avatar_url: string | null
  email_masked: string // k***@g***.com
  // As stored: user, moderator or admin, or a typo made by hand in SQL (rolePill).
  role: string
  is_active: boolean
  created_at: string // ISO 8601, with its offset
}

// What the role route takes: no route can make or unmake an admin.
export type AdminRole = 'user' | 'moderator'

// The reveal's answer, POST /api/admin/users/{id}/email. A plain call, never a
// query: the address lives only in the page's state, never in TanStack's cache.
interface RevealedEmail {
  id: number
  email: string
}

// Under ['admin'], which clearUserQueries (AuthContext) drops at every sign-out.
export const ADMIN_USERS_KEY = ['admin', 'users'] as const

const SEARCH_DEBOUNCE_MS = 300
// Each covers the whole call: a token refresh inside authFetch, and the body.
const LIST_TIMEOUT_MS = 15_000
const REVEAL_TIMEOUT_MS = 15_000
const WRITE_TIMEOUT_MS = 15_000
// A delete also removes the avatar from Cloudinary, bounded at 15 s on the server.
const DELETE_TIMEOUT_MS = 30_000

// Rejects with the signal's reason once it aborts, whatever the work is waiting on:
// authFetch's token refresh has no deadline of its own, and a fetch signal only
// reaches the request itself. The same race as useBulkProgress's.
function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  let onAbort = () => {}
  const aborted = new Promise<never>((_, reject) => {
    // A timeout's reason is the TimeoutError DOMException the error copy looks for.
    onAbort = () => reject(signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason)))
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  })
  return Promise.race([work, aborted]).finally(() => signal.removeEventListener('abort', onAbort))
}

// One signal for TanStack's cancellation and the deadline. AbortSignal.any would
// do, but it is newer than the rest of what the site relies on.
function eitherSignal(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController()
  for (const signal of [a, b]) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      break
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }
  return controller.signal
}

/**
 * The admin page's accounts: the list (every account, or a search), and each action
 * on one. `search` is the box as typed; the list follows it 300 ms later, trimmed.
 * Enabled only for an admin. Every call is no-store and has a deadline,
 * and a 403 from any of them refreshes the session once, so a role lost since sign-in
 * ends at the 404 the route guard (ProtectedRoute's adminOnly) shows non-admins.
 */
export function useAdminUsers(search: string) {
  const { user, isAuthenticated, isLoading: authLoading, authFetch, refreshToken } = useAuth()
  const queryClient = useQueryClient()

  const [debounced, setDebounced] = useState(search)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [search])
  // Trimmed before the key and the request, so "kyo" and "kyo " are one search.
  const term = debounced.trim()

  const request = useCallback(
    (path: string, init: RequestInit, timeoutMs: number, fallback: string, cancel?: AbortSignal): Promise<unknown> => {
      const deadline = AbortSignal.timeout(timeoutMs)
      const signal = cancel ? eitherSignal(cancel, deadline) : deadline
      return untilAborted((async () => {
        const res = await authFetch(`${API_BASE_URL}/admin${path}`, { ...init, cache: 'no-store', signal })
        if (!res.ok) {
          // A role lost since sign-in: the refreshed session carries the new one. Also
          // sent for "Admin accounts can't be changed here.", where it changes nothing.
          if (res.status === 403) void refreshToken()
          throw new ApiError(res.status, await readError(res, fallback))
        }
        return res.status === 204 ? null : (res.json() as Promise<unknown>)
      })(), signal)
    },
    [authFetch, refreshToken],
  )
  // authFetch changes with every auth state change; the callbacks below stay put, so
  // the memoized rows they reach don't re-render for it.
  const requestRef = useRef(request)
  useEffect(() => { requestRef.current = request })

  const list = useQuery({
    queryKey: [...ADMIN_USERS_KEY, user?.id, term],
    queryFn: async ({ signal }) => {
      // Nothing that long can match, and the server would answer it with a 422.
      if (searchTooLong(term)) return []
      // A POST keeps a typed address out of the URL, and so out of every request log.
      const body = term
        ? await request('/users/search', { method: 'POST', body: JSON.stringify({ q: term }) }, LIST_TIMEOUT_MS, ADMIN_COPY.loadError, signal)
        : await request('/users', {}, LIST_TIMEOUT_MS, ADMIN_COPY.loadError, signal)
      return body as AdminUser[]
    },
    // The admin role, as the route guard renders nothing else. Not gated on holding a
    // token, unlike useUserStats: after a refresh that failed for a moment, a new
    // search would sit on "Searching…" for good. authFetch refreshes first when it
    // holds no token, and a refresh that fails again lands in the error with Try again.
    enabled: user?.role === 'admin' && isAuthenticated && !authLoading,
    // The last list stays up while the next search loads.
    placeholderData: keepPreviousData,
    // Always asked again: roles and statuses change, and nothing invalidates them for
    // us. Kept for no time, so no account list outlives the page.
    staleTime: 0,
    gcTime: 0,
    // The page says what went wrong at once and offers Try again.
    retry: false,
  })

  // After a failed action, the list asks again: a timeout may still have committed,
  // and a 404 or 403 means the account changed since the list loaded.
  const refreshList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY })
  }, [queryClient])

  // A changed row replaces its old self in every cached list. setQueriesData only
  // touches queries that exist, so a write landing after a sign-out recreates nothing.
  const putRow = useCallback((row: AdminUser) => {
    queryClient.setQueriesData<AdminUser[]>({ queryKey: ADMIN_USERS_KEY }, old => replaceRow(old, row))
  }, [queryClient])

  const roleMutation = useMutation<AdminUser, Error, { id: number; role: AdminRole }>({
    mutationKey: ['admin', 'role'],
    // Offline fails at once instead of pausing and sending later.
    networkMode: 'always',
    mutationFn: ({ id, role }) =>
      requestRef.current(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }, WRITE_TIMEOUT_MS, ADMIN_COPY.roleError) as Promise<AdminUser>,
    onSuccess: row => {
      putRow(row)
      // Comment badges show the author's role, so this tab's threads ask again.
      void queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
    onError: refreshList,
  })

  const activeMutation = useMutation<AdminUser, Error, { id: number; active: boolean }>({
    mutationKey: ['admin', 'active'],
    networkMode: 'always',
    mutationFn: ({ id, active }) =>
      requestRef.current(`/users/${id}/active`, { method: 'PUT', body: JSON.stringify({ active }) }, WRITE_TIMEOUT_MS, ADMIN_COPY.statusError) as Promise<AdminUser>,
    onSuccess: putRow,
    onError: refreshList,
  })

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationKey: ['admin', 'delete'],
    networkMode: 'always',
    mutationFn: id => requestRef.current(`/users/${id}`, { method: 'DELETE' }, DELETE_TIMEOUT_MS, ADMIN_COPY.deleteError),
    onSuccess: (_data, id) => {
      queryClient.setQueriesData<AdminUser[]>({ queryKey: ADMIN_USERS_KEY }, old => removeRow(old, id))
      // The account's comments are erased now, but this tab may still hold them as they
      // were, text and all. Drop them so the next thread asks again, as Settings does.
      queryClient.removeQueries({ queryKey: ['comments'] })
      // Replies it sent this admin stay, now from no one (the bell says Someone),
      // so the bell asks again.
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
    },
    onError: refreshList,
  })

  // TanStack keeps mutateAsync stable, so these are too.
  const { mutateAsync: mutateRole } = roleMutation
  const { mutateAsync: mutateActive } = activeMutation
  const { mutateAsync: mutateDelete } = deleteMutation
  const setRole = useCallback((id: number, role: AdminRole) => mutateRole({ id, role }), [mutateRole])
  const setActive = useCallback((id: number, active: boolean) => mutateActive({ id, active }), [mutateActive])
  const deleteUser = useCallback(async (id: number) => { await mutateDelete(id) }, [mutateDelete])

  const revealEmail = useCallback(async (id: number): Promise<string> => {
    try {
      const body = await requestRef.current(`/users/${id}/email`, { method: 'POST' }, REVEAL_TIMEOUT_MS, ADMIN_COPY.revealError)
      return (body as RevealedEmail).email
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) refreshList()
      throw err
    }
  }, [refreshList])

  return {
    list,
    // The search the list answers.
    term,
    // A newer search is waiting out the debounce or loading over the last list.
    searching: search.trim() !== term || list.isPlaceholderData,
    setRole,
    setActive,
    deleteUser,
    revealEmail,
  }
}
