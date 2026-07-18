import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useToast } from '../context/ToastContext'
import { API_BASE_URL, ApiError, readError, errorMessage } from '../services/api'
import type { ProgressWriteResponse } from '../services/api'

// Also hardcoded in AuthContext's merge-on-login effect — keep in sync.
const STORAGE_KEY = 'sb_progress'

const PROGRESS_WRITE_KEY = ['progress', 'write']

// Module scope, not a ref: mutations outlive their hook instance (a click
// followed by navigation settles after the page's hook unmounted), and the
// ['progress'] cache this flag re-syncs is app-global — a per-instance ref
// would drop drift raised by a dying instance while a newer one settles last.
let driftPending = false

// Flush the deferred re-sync once no other write is in flight. A settling
// mutation still counts itself in isMutating during its own onSettled, so 1
// means "self only". Two writes settling in the same microtask wave can each
// still see the other as pending (both defer) — the zero-delay re-check runs
// after their dispatches land, when the count has truly reached 0.
function maybeFlushDrift(queryClient: ReturnType<typeof useQueryClient>) {
  if (!driftPending) return
  if (queryClient.isMutating({ mutationKey: PROGRESS_WRITE_KEY }) === 1) {
    driftPending = false
    void queryClient.invalidateQueries({ queryKey: ['progress'] })
  } else {
    setTimeout(() => {
      if (driftPending && queryClient.isMutating({ mutationKey: PROGRESS_WRITE_KEY }) === 0) {
        driftPending = false
        void queryClient.invalidateQueries({ queryKey: ['progress'] })
      }
    }, 0)
  }
}

function getLocalProgress(): Set<number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function setLocalProgress(ids: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function useProgress() {
  const { isAuthenticated, isLoading: authLoading, authFetch } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Guest state
  const [guestIds, setGuestIds] = useState<Set<number>>(() => getLocalProgress())

  // Per-collectible in-flight tracking for authenticated toggles, so the UI can
  // disable a single checkbox while its write is pending without disabling the rest.
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set())

  // Authenticated state via TanStack Query
  const { data: serverIds, isLoading: queryLoading, isError: loadFailed, error: loadErr } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/progress`)
      if (!res.ok) throw new ApiError(res.status, await readError(res, 'Failed to load progress'))
      const ids: number[] = await res.json()
      return ids
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000,       // 5 minutes before refetch
    gcTime: 60 * 60 * 1000,          // keep in cache for 1 hour
    // Override the global `false`: a long-backgrounded tab must re-sync before
    // the user can act on stale checkboxes (a discarded tab re-asserting its
    // old state is what corrupted progress under the POST toggle). Suppressed
    // while a write is in flight — a focus refetch started mid-write isn't
    // covered by onMutate's cancelQueries and could overwrite the optimistic
    // entry with pre-commit server state.
    refetchOnWindowFocus: () => queryClient.isMutating({ mutationKey: PROGRESS_WRITE_KEY }) === 0,
  })

  // Surface a load failure instead of silently showing zero progress.
  useEffect(() => {
    if (loadFailed) showToast(errorMessage(loadErr, "Couldn't load your saved progress."))
  }, [loadFailed, loadErr, showToast])

  const completedIds = isAuthenticated
    ? new Set(serverIds ?? [])
    : guestIds

  const isLoading = authLoading || (isAuthenticated && queryLoading)

  // driftPending (module scope, above) is set when a write's no-op status or a
  // write error reveals the cache was stale. The re-sync invalidation is
  // deferred to mutation-quiescence so a refetch can never clobber an
  // optimistic update — onMutate's cancelQueries kills any in-flight refetch,
  // and the isInvalidated re-arm below re-schedules one that got cancelled.
  // Every settled PUT/DELETE already converges its own id (PUT ends present on
  // both sides, DELETE absent), so the refetch only exists to pick up *other*
  // ids that changed elsewhere (another device, a discarded tab).
  //
  // Authenticated writes: the client sends its intent as a verb (PUT = mark
  // found, DELETE = mark not found). The server never inverts based on its own
  // row state — re-asserting from a stale cache is a harmless no-op.
  const writeMutation = useMutation({
    mutationKey: PROGRESS_WRITE_KEY,
    mutationFn: async ({ collectibleId, desired }: { collectibleId: number; desired: boolean }) => {
      const res = await authFetch(`${API_BASE_URL}/progress/${collectibleId}`, {
        method: desired ? 'PUT' : 'DELETE',
      })
      if (!res.ok) throw new ApiError(res.status, await readError(res, 'Failed to save progress'))
      return res.json() as Promise<ProgressWriteResponse>
    },
    onMutate: async ({ collectibleId, desired }) => {
      // Captured BEFORE the cancel: cancel-with-revert restores the pre-fetch
      // state (data intact, not invalidated), so a staleness/focus refetch
      // killed mid-flight would otherwise leave no trace — and the optimistic
      // setQueryData below re-stamps the data fresh, so it would never be
      // rescheduled. Any cancelled fetch must re-run at quiescence.
      const wasFetching = queryClient.isFetching({ queryKey: ['progress'] }) > 0
      await queryClient.cancelQueries({ queryKey: ['progress'] })
      const state = queryClient.getQueryState<number[]>(['progress'])
      // Re-arm the re-sync if this click just cancelled something unfinished:
      // any in-flight fetch (initial load, drift refetch, focus refetch), or a
      // query still marked invalidated from an earlier cancelled invalidation.
      if (wasFetching || !state?.data || state.isInvalidated) driftPending = true
      const previous = state?.data ?? []

      const next = desired
        ? (previous.includes(collectibleId) ? previous : [...previous, collectibleId])
        : previous.filter(id => id !== collectibleId)

      queryClient.setQueryData(['progress'], next)
      return { previous }
    },
    onSuccess: (data, { desired }) => {
      const noOp = desired ? data.status === 'already_complete' : data.status === 'not_found'
      if (noOp) driftPending = true
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['progress'], context.previous)
      }
      // The rollback snapshot may itself be stale — re-sync at quiescence.
      driftPending = true
      showToast(errorMessage(err, "Couldn't save your progress. Please try again."))
    },
    // Config-level, NOT mutate-scoped: TanStack only fires mutate-scoped
    // callbacks for the latest mutate() call, so a second click while an
    // earlier write is in flight would strand the earlier id in pendingIds
    // (checkbox disabled forever). Config-level callbacks run for every
    // mutation, even after the owning page unmounted.
    onSettled: (_data, _error, { collectibleId }) => {
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(collectibleId)
        return next
      })
      maybeFlushDrift(queryClient)
    },
  })

  const toggle = useCallback(async (collectibleId: number) => {
    if (isAuthenticated) {
      // Intent is read from the query cache (not render state) at click time:
      // earlier optimistic writes have already landed there, so rapid clicks
      // across different items each compute against the freshest belief. Same-id
      // clicks are serialized by the pendingIds disable below.
      const current = queryClient.getQueryData<number[]>(['progress']) ?? []
      const desired = !current.includes(collectibleId)
      setPendingIds(prev => new Set(prev).add(collectibleId))
      writeMutation.mutate({ collectibleId, desired })
    } else {
      setGuestIds(prev => {
        const next = new Set(prev)
        if (next.has(collectibleId)) {
          next.delete(collectibleId)
        } else {
          next.add(collectibleId)
        }
        setLocalProgress(next)
        return next
      })
    }
  }, [isAuthenticated, writeMutation, queryClient])

  const isCompleted = useCallback((id: number) => completedIds.has(id), [completedIds])
  const isToggling = useCallback((id: number) => pendingIds.has(id), [pendingIds])

  return {
    completedIds,
    isCompleted,
    isToggling,
    toggle,
    isLoading,
  }
}