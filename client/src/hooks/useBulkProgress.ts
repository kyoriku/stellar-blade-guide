import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { dropFromLocalProgress, requestProgressResync } from './useProgress'
import { API_BASE_URL, ApiError, readError } from '../services/api'
import type { BulkPreviewResponse, BulkProgressRequest, BulkProgressResponse } from '../services/api'
import { BULK_COPY } from '../constants/bulkProgressCopy'
import { GuestSyncPendingError, wasRefused } from '../utils/bulkProgress'
import { markBulkDone } from '../utils/handClearTip'

// Under ['progress'], so one useIsMutating({ mutationKey: ['progress'] }) counts the
// per-item writes and this one; not under ['progress', 'write'], whose "only me is
// left" drift check belongs to the per-item writes.
const BULK_KEY = ['progress', 'bulk']

// The sign-in sync has no timeout of its own, so the wait for it is bounded.
const SYNC_WAIT_MS = 10_000
// Each covers the whole call: the sync wait, a token refresh inside authFetch, and
// the body. A write's bound is how long the dialog can stay on "Saving…".
const PREVIEW_TIMEOUT_MS = 15_000
const WRITE_TIMEOUT_MS = 30_000

// Rejects with the signal's reason once it aborts, whatever the work is waiting on:
// authFetch's token refresh has no deadline of its own, and a fetch signal only
// reaches the request itself.
function untilDeadline<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  let onAbort = () => {}
  const aborted = new Promise<never>((_, reject) => {
    // A timeout's reason is the TimeoutError DOMException the error copy looks for.
    onAbort = () => reject(signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason)))
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  })
  return Promise.race([work, aborted]).finally(() => signal.removeEventListener('abort', onAbort))
}

async function settledSync(waitForGuestSync: () => Promise<void>): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new GuestSyncPendingError()), SYNC_WAIT_MS)
  })
  try {
    await Promise.race([waitForGuestSync(), timeout])
  } finally {
    clearTimeout(timer)
  }
}

export interface BulkWrite {
  req: BulkProgressRequest
  // The preview's scope ids, dropped from this device's guest copy after a clear.
  scopeIds: number[]
}

export function useBulkProgress() {
  const { authFetch, waitForGuestSync } = useAuth()
  const queryClient = useQueryClient()

  const preview = useCallback(async (req: BulkProgressRequest): Promise<BulkPreviewResponse> => {
    const deadline = AbortSignal.timeout(PREVIEW_TIMEOUT_MS)
    // A sync still in flight would change the count, or land after the write.
    await untilDeadline(settledSync(waitForGuestSync), deadline)
    const res = await untilDeadline(authFetch(`${API_BASE_URL}/progress/bulk/preview`, {
      method: 'POST',
      body: JSON.stringify(req),
      signal: deadline,
    }), deadline)
    if (!res.ok) throw new ApiError(res.status, await readError(res, BULK_COPY.previewError))
    return (await res.json()) as BulkPreviewResponse
  }, [authFetch, waitForGuestSync])

  const apply = useMutation<BulkProgressResponse, Error, BulkWrite>({
    mutationKey: BULK_KEY,
    // The default pauses a mutation started offline and sends it on reconnect,
    // possibly long after the user left; offline now fails at once instead.
    networkMode: 'always',
    mutationFn: async ({ req }) => {
      const deadline = AbortSignal.timeout(WRITE_TIMEOUT_MS)
      await untilDeadline(settledSync(waitForGuestSync), deadline)
      const res = await untilDeadline(authFetch(`${API_BASE_URL}/progress/bulk`, {
        method: 'POST',
        body: JSON.stringify(req),
        signal: deadline,
      }), deadline)
      if (!res.ok) throw new ApiError(res.status, await readError(res, BULK_COPY.applyError))
      return (await res.json()) as BulkProgressResponse
    },
    // These callbacks never set query data: a setQueryData(['progress']) here
    // would recreate the query after a sign-out's clearUserQueries and paint one
    // account's progress for the next.
    // Config-level, so it runs even if the card unmounted mid-write. A browser
    // that has used the tool never needs the hand-clear tip.
    onSuccess: () => markBulkDone(() => window.localStorage),
    onSettled: async (_data, error, { req, scopeIds }) => {
      // On failure too, unless the server refused outright: a request that timed
      // out or lost its response may still have committed.
      if (req.action === 'clear' && !wasRefused(error)) dropFromLocalProgress(scopeIds)
      // Cancel first, as the sign-in sync does: with no data yet, a load already in
      // flight would be reused as-is, answering with pre-write state.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['progress'] }),
        queryClient.cancelQueries({ queryKey: ['user-stats'] }),
      ])
      requestProgressResync(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    },
  })

  return { preview, apply }
}
