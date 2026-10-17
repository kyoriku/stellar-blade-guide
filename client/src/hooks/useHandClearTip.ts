import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { BULK_COPY } from '../constants/bulkProgressCopy'
import { claimTip, createUntickWindow, noteToggle } from '../utils/handClearTip'

// Module scope, like useProgress's driftPending: the count belongs to the tab, not
// to one page's instance. A level page stays mounted from one level to the next,
// and each scope starts its own count anyway.
const untickWindow = createUntickWindow()

/**
 * For the level and type pages: notes each signed-in toggle (`found` is the click's
 * intent) and shows the one-time tip on the untick that crosses the threshold.
 * `scope` is the page as Manage progress names it ('level:Eidos 7',
 * 'type:documents'), `label` the name the tip gives it. Call it after the write is
 * on its way, so the tip's storage can never touch the write.
 */
export function useHandClearTip(scope: string | null, label: string) {
  const { showToast } = useToast()
  const navigate = useNavigate()

  return useCallback((id: number, found: boolean) => {
    if (scope === null || !noteToggle(untickWindow, scope, id, found, Date.now())) return
    if (!claimTip(() => window.localStorage)) return
    showToast(BULK_COPY.handClearTip(label), {
      variant: 'info',
      // No timer: it shows once, to someone whose eyes are on the list.
      duration: Infinity,
      action: {
        label: BULK_COPY.handClearAction,
        // Router state, not the URL: nothing outside the site can prefill the card,
        // and BulkProgressSection spends it, so a reload doesn't arrive again. From
        // an open Progress page it replaces the entry, so Back still leaves the page;
        // the path is read at the press, since this closure belongs to the page that
        // showed the tip.
        onClick: () => void navigate('/progress', {
          state: { manageProgress: scope },
          replace: window.location.pathname === '/progress',
        }),
      },
    })
  }, [scope, label, showToast, navigate])
}
